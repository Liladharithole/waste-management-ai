import { Test, TestingModule } from '@nestjs/testing';
import { DriverAppService } from './driver-app.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('DriverAppService', () => {
  let service: DriverAppService;

  const mockPrismaMain = {
    dispatchAssignment: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    dispatchStopLog: {
      create: jest.fn(),
    },
    wasteVehicle: {
      update: jest.fn(),
    },
  };

  const mockPrismaCore = {
    employee: {
      findFirst: jest.fn(),
    },
    notificationLog: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverAppService,
        { provide: PrismaService, useValue: mockPrismaMain },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<DriverAppService>(DriverAppService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('startShift', () => {
    it('should start driver shift and update starting odometer', async () => {
      mockPrismaCore.employee.findFirst.mockResolvedValue({ id: 5 });
      mockPrismaMain.dispatchAssignment.findFirst.mockResolvedValue({
        id: 10,
        status: 'ASSIGNED',
        vehicle: { id: 1, registrationNumber: 'MH-12-AB-1234', complianceStatus: 'COMPLIANT' },
      });
      mockPrismaMain.dispatchAssignment.update.mockResolvedValue({
        id: 10,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        startOdometerKm: 45210,
      });

      const result = await service.startShift(10, 100, { startOdometerKm: 45210 });

      expect(result.dispatchId).toBe(10);
      expect(result.status).toBe('IN_PROGRESS');
      expect(result.startOdometerKm).toBe(45210);
    });
  });

  describe('reportEmergencyBreakdown', () => {
    it('should mark vehicle UNDER_MAINTENANCE and create emergency notification', async () => {
      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        employeeCode: 'EMP-005',
        user: { firstName: 'John', lastName: 'Doe' },
      });
      mockPrismaMain.dispatchAssignment.findFirst.mockResolvedValue({
        id: 10,
        vehicle: { id: 1, registrationNumber: 'MH-12-AB-1234' },
      });
      mockPrismaMain.wasteVehicle.update.mockResolvedValue({ id: 1, status: 'UNDER_MAINTENANCE' });
      mockPrismaCore.notificationLog.create.mockResolvedValue({ id: 1 });

      const result = await service.reportEmergencyBreakdown(100, {
        dispatchId: 10,
        breakdownType: 'FLAT_TIRE',
        latitude: 18.5204,
        longitude: 73.8567,
        notes: 'Flat tire near gate',
      });

      expect(result.vehicleStatus).toBe('UNDER_MAINTENANCE');
      expect(result.breakdownType).toBe('FLAT_TIRE');
      expect(mockPrismaMain.wasteVehicle.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: expect.objectContaining({ status: 'UNDER_MAINTENANCE' }),
      });
    });
  });
});
