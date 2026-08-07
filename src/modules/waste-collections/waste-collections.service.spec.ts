import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WasteCollectionsService } from './waste-collections.service';
import { WasteCollectionsRepository } from './repositories/waste-collections.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('WasteCollectionsService', () => {
  let service: WasteCollectionsService;

  const mockCollectionsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCategoriesRepo = {
    findById: jest.fn(),
  };

  const mockPrismaCore = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WasteCollectionsService,
        { provide: WasteCollectionsRepository, useValue: mockCollectionsRepo },
        { provide: WasteCategoriesRepository, useValue: mockCategoriesRepo },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<WasteCollectionsService>(WasteCollectionsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated collection records', async () => {
      const mockList = [{ id: 1, collectorUserId: 10, residentUserId: 25, weight: 12.5 }];
      mockCollectionsRepo.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return collection log if found', async () => {
      const mockRecord = { id: 1, collectorUserId: 10, weight: 12.5 };
      mockCollectionsRepo.findById.mockResolvedValue(mockRecord);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException if log missing or deleted', async () => {
      mockCollectionsRepo.findById.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      collectorUserId: 10,
      residentUserId: 25,
      wasteCategoryId: 1,
      weight: 15.0,
      remarks: 'Organic waste',
    };

    it('should create collection record if users and category exist', async () => {
      mockPrismaCore.user.findUnique
        .mockResolvedValueOnce({ id: 10 }) // collector
        .mockResolvedValueOnce({ id: 25 }); // resident
      mockCategoriesRepo.findById.mockResolvedValue({ id: 1, name: 'Organic' });
      mockCollectionsRepo.create.mockResolvedValue({ id: 100, ...dto });

      const result = await service.create(dto, 'worker@example.com');

      expect(result).toHaveProperty('id', 100);
      expect(mockCollectionsRepo.create).toHaveBeenCalledWith(dto, 'worker@example.com');
    });

    it('should throw NotFoundException if collector missing', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if resident missing', async () => {
      mockPrismaCore.user.findUnique.mockResolvedValueOnce({ id: 10 }).mockResolvedValueOnce(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category missing', async () => {
      mockPrismaCore.user.findUnique
        .mockResolvedValueOnce({ id: 10 })
        .mockResolvedValueOnce({ id: 25 });
      mockCategoriesRepo.findById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { weight: 20.0 };

    it('should update collection record', async () => {
      mockCollectionsRepo.findById.mockResolvedValue({ id: 100, weight: 15.0 });
      mockCollectionsRepo.update.mockResolvedValue({ id: 100, weight: 20.0 });

      const result = await service.update(100, dto, 'worker@example.com');

      expect(result).toHaveProperty('weight', 20.0);
    });
  });

  describe('delete', () => {
    it('should soft delete collection log', async () => {
      mockCollectionsRepo.findById.mockResolvedValue({ id: 100, weight: 15.0 });
      mockCollectionsRepo.softDelete.mockResolvedValue({ id: 100, deletedAt: new Date() });

      const result = await service.delete(100, 'worker@example.com');

      expect(result).toHaveProperty('id', 100);
      expect(mockCollectionsRepo.softDelete).toHaveBeenCalledWith(100, 'worker@example.com');
    });
  });
});
