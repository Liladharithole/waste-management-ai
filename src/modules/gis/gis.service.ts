import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';
import { DispatchStatus } from '@prisma/client';

@Injectable()
export class GisService {
  constructor(
    private readonly prismaMain: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  async getActiveFleetLiveMap(organizationId?: number) {
    const activeDispatches = await this.prismaMain.dispatchAssignment.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [DispatchStatus.STARTED, DispatchStatus.IN_PROGRESS],
        },
        ...(organizationId ? { vehicle: { organizationId } } : {}),
      },
      include: {
        vehicle: true,
        schedule: true,
        stopLogs: {
          orderBy: { arrivalTime: 'desc' },
          take: 1,
        },
        _count: {
          select: { stopLogs: true },
        },
      },
    });

    const driverIds = activeDispatches.map((d) => d.driverEmployeeId);
    const drivers = await this.prismaCore.employee.findMany({
      where: { id: { in: driverIds }, deletedAt: null },
      include: {
        user: true,
      },
    });

    const liveFleet = await Promise.all(
      activeDispatches.map(async (dispatch) => {
        const driver = drivers.find((e) => e.id === dispatch.driverEmployeeId);
        const latestStop = dispatch.stopLogs[0] || null;

        const latitude = latestStop?.latitude || 18.5204;
        const longitude = latestStop?.longitude || 73.8567;

        // Calculate ETA to target schedule site if siteId exists
        let etaInfo: { distanceKm: number; etaMinutes: number; etaTimestamp: string } | null = null;
        if (dispatch.schedule?.siteId) {
          const site = await this.prismaCore.site.findFirst({
            where: { id: dispatch.schedule.siteId, deletedAt: null },
          });
          if (site && site.latitude && site.longitude) {
            etaInfo = await this.googleMapsService.calculateEtaAndDistance(
              latitude,
              longitude,
              site.latitude,
              site.longitude,
            );
          }
        }

        return {
          dispatchId: dispatch.id,
          shiftName: dispatch.shiftName,
          status: dispatch.status,
          startedAt: dispatch.startedAt,
          vehicle: {
            id: dispatch.vehicle.id,
            registrationNumber: dispatch.vehicle.registrationNumber,
            vehicleType: dispatch.vehicle.vehicleType,
            complianceStatus: dispatch.vehicle.complianceStatus,
          },
          driver: driver
            ? {
                id: driver.id,
                employeeCode: driver.employeeCode,
                name: driver.user
                  ? `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim()
                  : 'Driver',
                email: driver.user?.email || null,
              }
            : null,
          routeSchedule: {
            id: dispatch.schedule.id,
            name: dispatch.schedule.name,
            frequency: dispatch.schedule.frequency,
          },
          currentPosition: {
            latitude,
            longitude,
            lastCheckinTime: latestStop ? latestStop.arrivalTime : dispatch.startedAt,
          },
          etaToNextTargetSite: etaInfo,
          progress: {
            completedStopsCount: dispatch._count.stopLogs,
          },
        };
      }),
    );

    return {
      activeFleetCount: liveFleet.length,
      fleet: liveFleet,
      timestamp: new Date().toISOString(),
    };
  }

  async getDispatchRouteProgress(dispatchId: number) {
    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, deletedAt: null },
      include: {
        vehicle: true,
        schedule: true,
        stopLogs: {
          orderBy: { arrivalTime: 'asc' },
        },
      },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment with ID ${dispatchId} not found.`);
    }

    const driver = await this.prismaCore.employee.findFirst({
      where: { id: dispatch.driverEmployeeId, deletedAt: null },
      include: { user: true },
    });

    const totalCollectedWeightKg = dispatch.stopLogs.reduce(
      (sum, s) => sum + (s.collectedWeightKg || 0),
      0,
    );

    const latestStop = dispatch.stopLogs[dispatch.stopLogs.length - 1] || null;
    const currentLat = latestStop?.latitude || 18.5204;
    const currentLng = latestStop?.longitude || 73.8567;

    let etaInfo: { distanceKm: number; etaMinutes: number; etaTimestamp: string } | null = null;
    if (dispatch.schedule?.siteId) {
      const site = await this.prismaCore.site.findFirst({
        where: { id: dispatch.schedule.siteId, deletedAt: null },
      });
      if (site && site.latitude && site.longitude) {
        etaInfo = await this.googleMapsService.calculateEtaAndDistance(
          currentLat,
          currentLng,
          site.latitude,
          site.longitude,
        );
      }
    }

    return {
      dispatchId: dispatch.id,
      dispatchDate: dispatch.dispatchDate,
      shiftName: dispatch.shiftName,
      status: dispatch.status,
      vehicleRegistration: dispatch.vehicle.registrationNumber,
      driverName: driver?.user
        ? `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim()
        : 'Unknown Driver',
      startOdometerKm: dispatch.startOdometerKm,
      endOdometerKm: dispatch.endOdometerKm,
      distanceDrivenKm:
        dispatch.startOdometerKm !== null && dispatch.endOdometerKm !== null
          ? Math.max(0, dispatch.endOdometerKm - dispatch.startOdometerKm)
          : null,
      totalCollectedWeightKg: Math.round(totalCollectedWeightKg * 100) / 100,
      stopLogsCount: dispatch.stopLogs.length,
      etaToNextTargetSite: etaInfo,
      checkpoints: dispatch.stopLogs.map((s) => ({
        id: s.id,
        siteId: s.siteId,
        unitId: s.unitId,
        collectedWeightKg: s.collectedWeightKg,
        latitude: s.latitude,
        longitude: s.longitude,
        arrivalTime: s.arrivalTime,
        status: s.status,
        skipReason: s.skipReason,
      })),
    };
  }

  async getJourneyRouteReplay(dispatchId: number) {
    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, deletedAt: null },
      include: {
        vehicle: true,
      },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment #${dispatchId} not found.`);
    }

    const driver = await this.prismaCore.employee.findFirst({
      where: { id: dispatch.driverEmployeeId, deletedAt: null },
      include: { user: true },
    });

    const locationLogs = await this.prismaMain.vehicleLocationLog.findMany({
      where: { dispatchId },
      orderBy: { recordedAt: 'asc' },
    });

    return {
      dispatchId: dispatch.id,
      dispatchDate: dispatch.dispatchDate,
      shiftName: dispatch.shiftName,
      status: dispatch.status,
      vehicleRegistration: dispatch.vehicle.registrationNumber,
      driverName: driver?.user
        ? `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim()
        : 'Unknown Driver',
      totalBreadcrumbsCount: locationLogs.length,
      waypoints: locationLogs.map((log) => ({
        id: log.id.toString(),
        latitude: log.latitude,
        longitude: log.longitude,
        speedKmH: log.speedKmH,
        heading: log.heading,
        recordedAt: log.recordedAt,
      })),
    };
  }

  async getJourneyTimeline(dispatchId: number) {
    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, deletedAt: null },
      include: {
        vehicle: true,
        stopLogs: {
          orderBy: { arrivalTime: 'asc' },
        },
      },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment #${dispatchId} not found.`);
    }

    const driver = await this.prismaCore.employee.findFirst({
      where: { id: dispatch.driverEmployeeId, deletedAt: null },
      include: { user: true },
    });

    const notifications = await this.prismaCore.notificationLog.findMany({
      where: {
        createdBy: `dispatch:${dispatch.id}`,
      },
      orderBy: { createdAt: 'asc' },
    });

    const events: Array<{
      eventType: string;
      timestamp: Date;
      title: string;
      description: string;
      latitude?: number | null;
      longitude?: number | null;
      photoUrl?: string | null;
      metadata?: any;
    }> = [];

    // 1. Shift Started Event
    if (dispatch.startedAt) {
      events.push({
        eventType: 'SHIFT_STARTED',
        timestamp: dispatch.startedAt,
        title: 'Shift Started',
        description: `Started with odometer reading: ${dispatch.startOdometerKm || 0} km`,
        metadata: { startOdometerKm: dispatch.startOdometerKm },
      });
    }

    // 2. Stop Checkpoint Events
    let completedStopsCount = 0;
    let skippedStopsCount = 0;
    let totalWeightCollectedKg = 0;

    for (const stop of dispatch.stopLogs) {
      if (stop.status === 'SKIPPED') {
        skippedStopsCount++;
        events.push({
          eventType: 'CHECKPOINT_SKIPPED',
          timestamp: stop.arrivalTime,
          title: 'Pickup Skipped',
          description: `Skipped stop. Reason: ${stop.skipReason || 'N/A'}`,
          latitude: stop.latitude,
          longitude: stop.longitude,
          metadata: { skipReason: stop.skipReason, siteId: stop.siteId },
        });
      } else {
        completedStopsCount++;
        totalWeightCollectedKg += stop.collectedWeightKg || 0;
        events.push({
          eventType: 'CHECKPOINT_COMPLETED',
          timestamp: stop.arrivalTime,
          title: 'Pickup Completed',
          description: `Collected ${stop.collectedWeightKg} kg waste`,
          latitude: stop.latitude,
          longitude: stop.longitude,
          metadata: {
            collectedWeightKg: stop.collectedWeightKg,
            siteId: stop.siteId,
            unitId: stop.unitId,
          },
        });
      }
    }

    // 3. Alerts Events (Speeding, Emergency Breakdown)
    for (const n of notifications) {
      events.push({
        eventType: n.type,
        timestamp: n.createdAt,
        title: n.title,
        description: n.body,
        metadata: { notificationId: n.id },
      });
    }

    // 4. Shift Completed Event
    if (dispatch.completedAt) {
      events.push({
        eventType: 'SHIFT_COMPLETED',
        timestamp: dispatch.completedAt,
        title: 'Shift Completed',
        description: `Finished with odometer reading: ${dispatch.endOdometerKm || 0} km`,
        metadata: {
          endOdometerKm: dispatch.endOdometerKm,
          distanceDrivenKm:
            dispatch.startOdometerKm !== null && dispatch.endOdometerKm !== null
              ? Math.max(0, dispatch.endOdometerKm - dispatch.startOdometerKm)
              : 0,
        },
      });
    }

    // Sort events chronologically
    events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      dispatchId: dispatch.id,
      dispatchDate: dispatch.dispatchDate,
      shiftName: dispatch.shiftName,
      status: dispatch.status,
      vehicleRegistration: dispatch.vehicle.registrationNumber,
      driverName: driver?.user
        ? `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim()
        : 'Driver',
      summary: {
        totalKmDriven:
          dispatch.startOdometerKm !== null && dispatch.endOdometerKm !== null
            ? Math.max(0, dispatch.endOdometerKm - dispatch.startOdometerKm)
            : 0,
        totalWeightCollectedKg: Math.round(totalWeightCollectedKg * 100) / 100,
        completedStopsCount,
        skippedStopsCount,
        alertsCount: notifications.length,
      },
      timelineEvents: events,
    };
  }
}
