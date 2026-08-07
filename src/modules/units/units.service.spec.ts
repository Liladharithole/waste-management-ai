import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UnitsService } from './units.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('UnitsService', () => {
  let service: UnitsService;
  let prisma: any;

  const mockPrisma = {
    floor: {
      findUnique: jest.fn(),
    },
    unit: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    resident: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UnitsService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<UnitsService>(UnitsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated units', async () => {
      const mockList = [{ id: 1, unitNumber: '302' }];
      prisma.unit.findMany.mockResolvedValue(mockList);
      prisma.unit.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return unit if found', async () => {
      const mockUnit = { id: 1, unitNumber: '302' };
      prisma.unit.findUnique.mockResolvedValue(mockUnit);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUnit);
    });

    it('should throw NotFoundException if unit missing', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { floorId: 1, unitNumber: '302' };

    it('should create unit if floor exists', async () => {
      prisma.floor.findUnique.mockResolvedValue({ id: 1, floorNumber: 3 });
      prisma.unit.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 10);
      expect(prisma.unit.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException if floor does not exist', async () => {
      prisma.floor.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { unitNumber: '302-A' };

    it('should update unit details', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: 10, unitNumber: '302' });
      prisma.unit.update.mockResolvedValue({ id: 10, unitNumber: '302-A' });

      const result = await service.update(10, dto);

      expect(result).toHaveProperty('unitNumber', '302-A');
    });

    it('should throw NotFoundException if unit missing', async () => {
      prisma.unit.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete unit if no residents assigned', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: 10, unitNumber: '302' });
      prisma.resident.count.mockResolvedValue(0);
      prisma.unit.delete.mockResolvedValue({ id: 10 });

      const result = await service.delete(10);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw ConflictException if residents are assigned', async () => {
      prisma.unit.findUnique.mockResolvedValue({ id: 10, unitNumber: '302' });
      prisma.resident.count.mockResolvedValue(2);

      await expect(service.delete(10)).rejects.toThrow(ConflictException);
    });
  });
});
