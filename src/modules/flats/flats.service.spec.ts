import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FlatsService } from './flats.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('FlatsService', () => {
  let service: FlatsService;
  let prisma: any;

  const mockPrisma = {
    floor: {
      findUnique: jest.fn(),
    },
    flat: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
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
      providers: [FlatsService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FlatsService>(FlatsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all flats', async () => {
      const mockList = [{ id: 1, flatNumber: '302' }];
      prisma.flat.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('should return flat if found', async () => {
      const mockFlat = { id: 1, flatNumber: '302' };
      prisma.flat.findUnique.mockResolvedValue(mockFlat);

      const result = await service.findOne(1);

      expect(result).toEqual(mockFlat);
    });

    it('should throw NotFoundException if flat missing', async () => {
      prisma.flat.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { floorId: 1, flatNumber: '302' };

    it('should create flat if floor exists', async () => {
      prisma.floor.findUnique.mockResolvedValue({ id: 1, floorNumber: 3 });
      prisma.flat.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 10);
      expect(prisma.flat.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException if floor does not exist', async () => {
      prisma.floor.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { flatNumber: '302-A' };

    it('should update flat details', async () => {
      prisma.flat.findUnique.mockResolvedValue({ id: 10, flatNumber: '302' });
      prisma.flat.update.mockResolvedValue({ id: 10, flatNumber: '302-A' });

      const result = await service.update(10, dto);

      expect(result).toHaveProperty('flatNumber', '302-A');
    });

    it('should throw NotFoundException if flat missing', async () => {
      prisma.flat.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete flat if no residents assigned', async () => {
      prisma.flat.findUnique.mockResolvedValue({ id: 10, flatNumber: '302' });
      prisma.resident.count.mockResolvedValue(0);
      prisma.flat.delete.mockResolvedValue({ id: 10 });

      const result = await service.delete(10);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw ConflictException if residents are assigned', async () => {
      prisma.flat.findUnique.mockResolvedValue({ id: 10, flatNumber: '302' });
      prisma.resident.count.mockResolvedValue(2);

      await expect(service.delete(10)).rejects.toThrow(ConflictException);
    });
  });
});
