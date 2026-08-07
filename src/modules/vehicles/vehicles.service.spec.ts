import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesService } from './vehicles.service';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { ComplianceService } from '../compliance/compliance.service';
import { VehicleStatus, VehicleType } from '@prisma/client';

describe('VehiclesService', () => {
  let service: VehiclesService;

  const mockVehiclesRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    findByRegistrationNumber: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockComplianceService = {
    findAll: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        { provide: VehiclesRepository, useValue: mockVehiclesRepo },
        { provide: ComplianceService, useValue: mockComplianceService },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);

    jest.clearAllMocks();
  });

  describe('createVehicle', () => {
    it('should create vehicle when registration is unique', async () => {
      mockVehiclesRepo.findByRegistrationNumber.mockResolvedValue(null);
      mockVehiclesRepo.create.mockResolvedValue({
        id: 1,
        registrationNumber: 'MH-12-AB-1234',
        vehicleType: VehicleType.COMPACTOR_TRUCK,
        status: VehicleStatus.ACTIVE,
      });

      const result = await service.createVehicle({
        organizationId: 1,
        registrationNumber: 'MH-12-AB-1234',
        vehicleType: VehicleType.COMPACTOR_TRUCK,
        capacityMetricTons: 5.0,
      });

      expect(result.id).toBe(1);
      expect(mockVehiclesRepo.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return vehicle with attached compliance documents', async () => {
      mockVehiclesRepo.findById.mockResolvedValue({
        id: 1,
        registrationNumber: 'MH-12-AB-1234',
      });
      mockComplianceService.findAll.mockResolvedValue({ data: [] });

      const result = await service.findOne(1);
      expect(result.id).toBe(1);
      expect(result.complianceDocuments).toEqual([]);
    });
  });
});
