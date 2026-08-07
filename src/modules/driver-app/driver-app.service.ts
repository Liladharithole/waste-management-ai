import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { StopCheckpointDto } from './dto/stop-checkpoint.dto';
import { CompleteShiftDto } from './dto/complete-shift.dto';
import { ReportBreakdownDto } from './dto/report-breakdown.dto';
import { DispatchStatus } from '@prisma/client';

@Injectable()
export class DriverAppService {
  constructor(
    private readonly prismaMain: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  async getTodayShifts(userId: number) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee profile for User ID ${userId} not found.`);
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const dispatches = await this.prismaMain.dispatchAssignment.findMany({
      where: {
        driverEmployeeId: employee.id,
        dispatchDate: new Date(todayStr),
        deletedAt: null,
      },
      include: {
        vehicle: true,
        schedule: true,
        stopLogs: {
          orderBy: { arrivalTime: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      driverId: employee.id,
      employeeCode: employee.employeeCode,
      shiftDate: todayStr,
      totalShiftsCount: dispatches.length,
      shifts: dispatches.map((d) => ({
        dispatchId: d.id,
        shiftName: d.shiftName,
        status: d.status,
        startedAt: d.startedAt,
        completedAt: d.completedAt,
        vehicle: {
          id: d.vehicle.id,
          registrationNumber: d.vehicle.registrationNumber,
          vehicleType: d.vehicle.vehicleType,
          complianceStatus: d.vehicle.complianceStatus,
        },
        routeSchedule: d.schedule
          ? {
              id: d.schedule.id,
              name: d.schedule.name,
              frequency: d.schedule.frequency,
            }
          : null,
        stopLogsCount: d.stopLogs.length,
        startOdometerKm: d.startOdometerKm,
        endOdometerKm: d.endOdometerKm,
      })),
    };
  }

  async startShift(dispatchId: number, userId: number, dto: StartShiftDto) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record for User ID ${userId} not found.`);
    }

    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, driverEmployeeId: employee.id, deletedAt: null },
      include: { vehicle: true },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment #${dispatchId} not found for this driver.`);
    }

    if (dispatch.status === DispatchStatus.COMPLETED) {
      throw new BadRequestException(`Dispatch assignment #${dispatchId} is already completed.`);
    }

    if (dispatch.vehicle.complianceStatus === 'NON_COMPLIANT') {
      throw new BadRequestException(
        `Cannot start shift. Vehicle ${dispatch.vehicle.registrationNumber} is NON_COMPLIANT due to expired documents!`,
      );
    }

    const updated = await this.prismaMain.dispatchAssignment.update({
      where: { id: dispatchId },
      data: {
        status: DispatchStatus.IN_PROGRESS,
        startedAt: dispatch.startedAt || new Date(),
        startOdometerKm: dto.startOdometerKm,
        updatedAt: new Date(),
      },
      include: { vehicle: true },
    });

    return {
      message: 'Shift started successfully',
      dispatchId: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
      startOdometerKm: updated.startOdometerKm,
    };
  }

  async recordStopCheckpoint(dispatchId: number, userId: number, dto: StopCheckpointDto) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record for User ID ${userId} not found.`);
    }

    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, driverEmployeeId: employee.id, deletedAt: null },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment #${dispatchId} not found for this driver.`);
    }

    const stopLog = await this.prismaMain.dispatchStopLog.create({
      data: {
        dispatchId,
        siteId: dto.siteId,
        unitId: dto.unitId,
        collectedWeightKg: dto.collectedWeightKg,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status || 'COMPLETED',
        skipReason: dto.skipReason || null,
        arrivalTime: new Date(),
      },
    });

    return {
      message: 'Checkpoint logged successfully',
      stopLogId: stopLog.id,
      collectedWeightKg: stopLog.collectedWeightKg,
      arrivalTime: stopLog.arrivalTime,
      photoUrl: dto.photoUrl || null,
    };
  }

  async completeShift(dispatchId: number, userId: number, dto: CompleteShiftDto) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record for User ID ${userId} not found.`);
    }

    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dispatchId, driverEmployeeId: employee.id, deletedAt: null },
      include: { stopLogs: true },
    });

    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment #${dispatchId} not found for this driver.`);
    }

    if (dispatch.startOdometerKm && dto.endOdometerKm < dispatch.startOdometerKm) {
      throw new BadRequestException(
        `Ending odometer (${dto.endOdometerKm} km) cannot be less than starting odometer (${dispatch.startOdometerKm} km).`,
      );
    }

    const totalCollectedWeightKg = dispatch.stopLogs.reduce(
      (sum, s) => sum + (s.collectedWeightKg || 0),
      0,
    );

    const updated = await this.prismaMain.dispatchAssignment.update({
      where: { id: dispatchId },
      data: {
        status: DispatchStatus.COMPLETED,
        completedAt: new Date(),
        endOdometerKm: dto.endOdometerKm,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Shift completed successfully',
      dispatchId: updated.id,
      status: updated.status,
      startedAt: updated.startedAt,
      completedAt: updated.completedAt,
      distanceDrivenKm:
        updated.startOdometerKm !== null && updated.endOdometerKm !== null
          ? updated.endOdometerKm - updated.startOdometerKm
          : 0,
      totalStopsCompleted: dispatch.stopLogs.length,
      totalCollectedWeightKg,
    };
  }

  async reportEmergencyBreakdown(userId: number, dto: ReportBreakdownDto) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
      include: { user: true },
    });

    if (!employee) {
      throw new NotFoundException(`Employee record for User ID ${userId} not found.`);
    }

    const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
      where: { id: dto.dispatchId, driverEmployeeId: employee.id, deletedAt: null },
      include: { vehicle: true },
    });

    if (!dispatch) {
      throw new NotFoundException(
        `Dispatch assignment #${dto.dispatchId} not found for this driver.`,
      );
    }

    // 1. Mark truck status UNDER_MAINTENANCE
    await this.prismaMain.wasteVehicle.update({
      where: { id: dispatch.vehicle.id },
      data: {
        status: 'UNDER_MAINTENANCE',
        updatedAt: new Date(),
      },
    });

    // 2. Create Emergency Notification Log in central_core_db
    const driverName = employee.user
      ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim()
      : employee.employeeCode;

    await this.prismaCore.notificationLog.create({
      data: {
        userId,
        title: `🚨 EMERGENCY BREAKDOWN: Truck ${dispatch.vehicle.registrationNumber}`,
        body: `Driver ${driverName} reported ${dto.breakdownType} breakdown at GPS (${dto.latitude}, ${dto.longitude}). Notes: ${dto.notes || 'N/A'}`,
        type: 'EMERGENCY_BREAKDOWN',
        status: 'SENT',
        createdBy: `driver:${employee.id}`,
      },
    });

    return {
      message: 'Emergency breakdown reported successfully. Fleet manager notified.',
      dispatchId: dispatch.id,
      vehicleRegistration: dispatch.vehicle.registrationNumber,
      vehicleStatus: 'UNDER_MAINTENANCE',
      breakdownType: dto.breakdownType,
      latitude: dto.latitude,
      longitude: dto.longitude,
      reportedAt: new Date().toISOString(),
    };
  }

  async getDriverProfile(userId: number) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
      include: {
        user: {
          include: {
            userProfile: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Driver profile for User ID ${userId} not found.`);
    }

    const complianceDocs = await this.prismaCore.complianceDocument.findMany({
      where: {
        entityType: 'EMPLOYEE',
        entityId: employee.id,
        deletedAt: null,
      },
    });

    const drivingLicense = complianceDocs.find((doc) => doc.documentType === 'DRIVING_LICENSE');

    return {
      driverId: employee.id,
      userId: employee.userId,
      employeeCode: employee.employeeCode,
      name: employee.user
        ? `${employee.user.firstName || ''} ${employee.user.lastName || ''}`.trim()
        : 'Driver',
      email: employee.user?.email || null,
      phone: employee.user?.userProfile?.phone || null,
      organizationId: employee.organizationId,
      designation: employee.designation,
      drivingLicense: drivingLicense
        ? {
            documentNumber: drivingLicense.documentNumber,
            status: drivingLicense.status,
            expiryDate: drivingLicense.expiryDate,
          }
        : null,
      complianceBadge: drivingLicense?.status === 'EXPIRED' ? 'WARNING' : 'COMPLIANT',
    };
  }

  async getShiftHistorySummary(userId: number) {
    const employee = await this.prismaCore.employee.findFirst({
      where: { userId, deletedAt: null },
    });

    if (!employee) {
      throw new NotFoundException(`Driver profile for User ID ${userId} not found.`);
    }

    const completedShifts = await this.prismaMain.dispatchAssignment.findMany({
      where: {
        driverEmployeeId: employee.id,
        status: DispatchStatus.COMPLETED,
        deletedAt: null,
      },
      include: {
        vehicle: true,
        stopLogs: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 50,
    });

    let totalKmDriven = 0;
    let totalWasteCollectedKg = 0;

    const history = completedShifts.map((s) => {
      const kmDriven =
        s.startOdometerKm !== null && s.endOdometerKm !== null
          ? Math.max(0, s.endOdometerKm - s.startOdometerKm)
          : 0;
      totalKmDriven += kmDriven;

      const shiftWeight = s.stopLogs.reduce((sum, log) => sum + (log.collectedWeightKg || 0), 0);
      totalWasteCollectedKg += shiftWeight;

      return {
        dispatchId: s.id,
        dispatchDate: s.dispatchDate,
        shiftName: s.shiftName,
        vehicleRegistration: s.vehicle.registrationNumber,
        kmDriven,
        stopsCount: s.stopLogs.length,
        collectedWeightKg: Math.round(shiftWeight * 100) / 100,
        completedAt: s.completedAt,
      };
    });

    return {
      driverId: employee.id,
      totalCompletedShifts: completedShifts.length,
      totalKmDriven: Math.round(totalKmDriven * 100) / 100,
      totalWasteCollectedKg: Math.round(totalWasteCollectedKg * 100) / 100,
      totalWasteCollectedTons: Math.round((totalWasteCollectedKg / 1000) * 100) / 100,
      history,
    };
  }
}
