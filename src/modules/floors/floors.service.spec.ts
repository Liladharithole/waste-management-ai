import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FloorsService } from './floors.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('FloorsService', () => {
  let service: FloorsService;
  let prisma: any;

  const mockPrisma = {
    building: {
      findUnique: jest.fn(),
    },
    floor: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    flat: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FloorsService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<FloorsService>(FloorsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all floors', async () => {
      const mockList = [{ id: 1, floorNumber: 3, name: '3rd Floor' }];
      prisma.floor.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('should return floor if found', async () => {
      const mockFloor = { id: 1, floorNumber: 3 };
      prisma.floor.findUnique.mockResolvedValue(mockFloor);

      const result = await service.findOne(1);

      expect(result).toEqual(mockFloor);
    });

    it('should throw NotFoundException if floor missing', async () => {
      prisma.floor.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { buildingId: 1, floorNumber: 3, name: '3rd Floor' };

    it('should create floor if building exists', async () => {
      prisma.building.findUnique.mockResolvedValue({ id: 1, name: 'Tower A' });
      prisma.floor.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 10);
      expect(prisma.floor.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException if building does not exist', async () => {
      prisma.building.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { name: 'Level 3' };

    it('should update floor details', async () => {
      prisma.floor.findUnique.mockResolvedValue({ id: 10, floorNumber: 3 });
      prisma.floor.update.mockResolvedValue({ id: 10, floorNumber: 3, name: 'Level 3' });

      const result = await service.update(10, dto);

      expect(result).toHaveProperty('name', 'Level 3');
    });

    it('should throw NotFoundException if floor missing', async () => {
      prisma.floor.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete floor if no flats linked', async () => {
      prisma.floor.findUnique.mockResolvedValue({ id: 10, floorNumber: 3 });
      prisma.flat.count.mockResolvedValue(0);
      prisma.floor.delete.mockResolvedValue({ id: 10 });

      const result = await service.delete(10);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw ConflictException if flats are linked', async () => {
      prisma.floor.findUnique.mockResolvedValue({ id: 10, floorNumber: 3 });
      prisma.flat.count.mockResolvedValue(4);

      await expect(service.delete(10)).rejects.toThrow(ConflictException);
    });
  });
});
