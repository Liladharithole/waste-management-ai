import { Test, TestingModule } from '@nestjs/testing';
import { GisService } from './gis.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

describe('GisService', () => {
  let service: GisService;

  const mockPrismaMain = {
    dispatchAssignment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    vehicleLocationLog: {
      findMany: jest.fn(),
    },
  };

  const mockPrismaCore = {
    employee: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
    site: {
      findFirst: jest.fn(),
    },
    notificationLog: {
      findMany: jest.fn(),
    },
  };

  const mockGoogleMapsService = {
    calculateEtaAndDistance: jest.fn().mockResolvedValue({
      distanceKm: 3.5,
      etaMinutes: 8,
      etaTimestamp: '2026-08-08T03:45:00.000Z',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GisService,
        { provide: PrismaService, useValue: mockPrismaMain },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
      ],
    }).compile();

    service = module.get<GisService>(GisService);

    jest.clearAllMocks();
  });

  describe('getActiveFleetLiveMap', () => {
    it('should return live active fleet map structure with ETA info', async () => {
      mockPrismaMain.dispatchAssignment.findMany.mockResolvedValue([
        {
          id: 1,
          status: 'STARTED',
          startedAt: new Date(),
          driverEmployeeId: 5,
          vehicle: { id: 10, registrationNumber: 'MH-12-AB-1234', vehicleType: 'COMPACTOR_TRUCK' },
          schedule: { id: 2, name: 'Zone A Morning', siteId: 20 },
          stopLogs: [],
          _count: { stopLogs: 0 },
        },
      ]);
      mockPrismaCore.employee.findMany.mockResolvedValue([
        {
          id: 5,
          employeeCode: 'EMP-005',
          user: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        },
      ]);
      mockPrismaCore.site.findFirst.mockResolvedValue({
        id: 20,
        latitude: 18.5401,
        longitude: 73.8712,
      });

      const result = await service.getActiveFleetLiveMap();
      expect(result.activeFleetCount).toBe(1);
      expect(result.fleet[0].vehicle.registrationNumber).toBe('MH-12-AB-1234');
      expect(result.fleet[0].etaToNextTargetSite?.etaMinutes).toBe(8);
    });
  });

  describe('getJourneyRouteReplay', () => {
    it('should return historical GPS breadcrumb waypoints for route replay', async () => {
      mockPrismaMain.dispatchAssignment.findFirst.mockResolvedValue({
        id: 10,
        dispatchDate: new Date('2026-08-08'),
        shiftName: 'MORNING',
        status: 'COMPLETED',
        driverEmployeeId: 5,
        vehicle: { registrationNumber: 'MH-12-AB-1234' },
      });
      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        user: { firstName: 'John', lastName: 'Doe' },
      });
      mockPrismaMain.vehicleLocationLog.findMany.mockResolvedValue([
        {
          id: BigInt(100),
          latitude: 18.5204,
          longitude: 73.8567,
          speedKmH: 30,
          heading: 180,
          recordedAt: new Date(),
        },
      ]);

      const result = await service.getJourneyRouteReplay(10);
      expect(result.dispatchId).toBe(10);
      expect(result.totalBreadcrumbsCount).toBe(1);
      expect(result.waypoints[0].latitude).toBe(18.5204);
    });
  });

  describe('getJourneyTimeline', () => {
    it('should compile chronological timeline of shift start, pickups, alerts, and completion', async () => {
      mockPrismaMain.dispatchAssignment.findFirst.mockResolvedValue({
        id: 10,
        dispatchDate: new Date('2026-08-08'),
        shiftName: 'MORNING',
        status: 'COMPLETED',
        startedAt: new Date('2026-08-08T07:00:00Z'),
        completedAt: new Date('2026-08-08T08:30:00Z'),
        startOdometerKm: 45210,
        endOdometerKm: 45285,
        driverEmployeeId: 5,
        vehicle: { registrationNumber: 'MH-12-AB-1234' },
        stopLogs: [
          {
            id: 1,
            arrivalTime: new Date('2026-08-08T07:15:00Z'),
            collectedWeightKg: 125,
            latitude: 18.5204,
            longitude: 73.8567,
            status: 'COMPLETED',
          },
        ],
      });
      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        user: { firstName: 'John', lastName: 'Doe' },
      });
      mockPrismaCore.notificationLog.findMany.mockResolvedValue([
        {
          id: 50,
          type: 'SPEEDING_ALERT',
          title: 'Speeding Alert',
          body: 'Clocked 68 km/h',
          createdAt: new Date('2026-08-08T07:20:00Z'),
        },
      ]);

      const result = await service.getJourneyTimeline(10);
      expect(result.dispatchId).toBe(10);
      expect(result.summary.completedStopsCount).toBe(1);
      expect(result.summary.alertsCount).toBe(1);
      expect(result.timelineEvents).toHaveLength(4); // SHIFT_STARTED, CHECKPOINT_COMPLETED, SPEEDING_ALERT, SHIFT_COMPLETED
    });
  });
});
