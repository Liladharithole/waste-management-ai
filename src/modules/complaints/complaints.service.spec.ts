import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintsService } from './complaints.service';
import { ComplaintsRepository } from './repositories/complaints.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

describe('ComplaintsService', () => {
  let service: ComplaintsService;

  const mockComplaintsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockPrismaCore = {
    user: {
      findUnique: jest.fn(),
    },
    unit: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintsService,
        { provide: ComplaintsRepository, useValue: mockComplaintsRepo },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<ComplaintsService>(ComplaintsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated complaints', async () => {
      const mockList = [
        { id: 1, complaintNumber: 'CMP-20260808-A1B2', status: ComplaintStatus.OPEN },
      ];
      mockComplaintsRepo.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return complaint if found', async () => {
      const mockComplaint = { id: 1, complaintNumber: 'CMP-20260808-A1B2' };
      mockComplaintsRepo.findById.mockResolvedValue(mockComplaint);

      const result = await service.findOne(1);

      expect(result).toEqual(mockComplaint);
    });

    it('should throw NotFoundException if complaint missing or deleted', async () => {
      mockComplaintsRepo.findById.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if complaint is soft-deleted (deletedAt is set)', async () => {
      mockComplaintsRepo.findById.mockResolvedValue({ id: 1, deletedAt: new Date() });

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create (Edge cases)', () => {
    const dto = {
      residentUserId: 25,
      unitId: 5,
      complaintType: 'MISSED_COLLECTION',
      title: 'Collection skipped',
      description: 'Bin not emptied',
      priority: ComplaintPriority.HIGH,
    };

    it('should create complaint if resident and unit exist', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 25 });
      mockPrismaCore.unit.findUnique.mockResolvedValue({ id: 5 });
      mockComplaintsRepo.create.mockResolvedValue({
        id: 1,
        complaintNumber: 'CMP-20260808-A1B2',
        ...dto,
      });

      const result = await service.create(dto, 'resident@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockComplaintsRepo.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if resident user does not exist', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('REAL-WORLD EDGE CASE: should throw NotFoundException if resident user is soft-deleted', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 25, deletedAt: new Date() });

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if unit does not exist', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 25 });
      mockPrismaCore.unit.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('REAL-WORLD EDGE CASE: should throw NotFoundException if referenced unit is soft-deleted', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 25 });
      mockPrismaCore.unit.findUnique.mockResolvedValue({ id: 5, deletedAt: new Date() });

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update (Edge cases)', () => {
    const dto = {
      assignedEmployeeId: 10,
      status: ComplaintStatus.IN_PROGRESS,
    };

    it('should update complaint details and assign worker', async () => {
      mockComplaintsRepo.findById.mockResolvedValue({ id: 1, status: ComplaintStatus.OPEN });
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 10 });
      mockComplaintsRepo.update.mockResolvedValue({
        id: 1,
        status: ComplaintStatus.IN_PROGRESS,
        assignedEmployeeId: 10,
      });

      const result = await service.update(1, dto, 'supervisor@example.com');

      expect(result).toHaveProperty('status', ComplaintStatus.IN_PROGRESS);
    });

    it('REAL-WORLD EDGE CASE: should throw NotFoundException if assigned worker/employee is soft-deleted', async () => {
      mockComplaintsRepo.findById.mockResolvedValue({ id: 1, status: ComplaintStatus.OPEN });
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 10, deletedAt: new Date() });

      await expect(service.update(1, dto, 'supervisor@example.com')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('REAL-WORLD EDGE CASE: should throw NotFoundException if updating non-existent or soft-deleted complaint', async () => {
      mockComplaintsRepo.findById.mockResolvedValue(null);

      await expect(service.update(99, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should soft delete complaint record', async () => {
      mockComplaintsRepo.findById.mockResolvedValue({ id: 1 });
      mockComplaintsRepo.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const result = await service.delete(1, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
    });
  });
});
