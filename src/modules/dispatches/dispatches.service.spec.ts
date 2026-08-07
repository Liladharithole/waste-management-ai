import { Test, TestingModule } from '@nestjs/testing';
import { DispatchesService } from './dispatches.service';
import { DispatchesRepository } from './repositories/dispatches.repository';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { BadRequestException } from '@nestjs/common';
import { ComplianceStatus, VehicleStatus } from '@prisma/client';

describe('DispatchesService', () => {
  let service: DispatchesService;

  const mockDispatchesRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateStatus: jest.fn(),
    addStopLog: jest.fn(),
    findOverlappingDispatch: jest.fn(),
  };

  const mockVehiclesRepo = {
    findById: jest.fn(),
  };

  const mockPrismaCore = {
    employee: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchesService,
        { provide: DispatchesRepository, useValue: mockDispatchesRepo },
        { provide: VehiclesRepository, useValue: mockVehiclesRepo },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<DispatchesService>(DispatchesService);

    jest.clearAllMocks();
  });

  describe('createDispatch', () => {
    it('should throw BadRequestException if vehicle is NON_COMPLIANT', async () => {
      mockVehiclesRepo.findById.mockResolvedValue({
        id: 1,
        registrationNumber: 'MH-12-AB-1234',
        status: VehicleStatus.ACTIVE,
        complianceStatus: ComplianceStatus.NON_COMPLIANT,
      });

      await expect(
        service.createDispatch({
          scheduleId: 1,
          vehicleId: 1,
          driverEmployeeId: 5,
          dispatchDate: '2026-08-08',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if driver is NON_COMPLIANT', async () => {
      mockVehiclesRepo.findById.mockResolvedValue({
        id: 1,
        registrationNumber: 'MH-12-AB-1234',
        status: VehicleStatus.ACTIVE,
        complianceStatus: ComplianceStatus.COMPLIANT,
      });

      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        complianceStatus: 'NON_COMPLIANT',
      });

      await expect(
        service.createDispatch({
          scheduleId: 1,
          vehicleId: 1,
          driverEmployeeId: 5,
          dispatchDate: '2026-08-08',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create shift dispatch when vehicle and driver are COMPLIANT', async () => {
      mockVehiclesRepo.findById.mockResolvedValue({
        id: 1,
        registrationNumber: 'MH-12-AB-1234',
        status: VehicleStatus.ACTIVE,
        complianceStatus: ComplianceStatus.COMPLIANT,
      });

      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        complianceStatus: 'COMPLIANT',
      });

      mockDispatchesRepo.findOverlappingDispatch.mockResolvedValue(null);
      mockDispatchesRepo.create.mockResolvedValue({ id: 100 });

      const result = await service.createDispatch({
        scheduleId: 1,
        vehicleId: 1,
        driverEmployeeId: 5,
        dispatchDate: '2026-08-08',
      });

      expect(result.id).toBe(100);
      expect(mockDispatchesRepo.create).toHaveBeenCalled();
    });
  });
});
