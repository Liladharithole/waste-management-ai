import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BuildingsService } from './buildings.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('BuildingsService', () => {
  let service: BuildingsService;
  let prisma: any;

  const mockPrisma = {
    site: {
      findUnique: jest.fn(),
    },
    building: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    floor: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BuildingsService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<BuildingsService>(BuildingsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all buildings', async () => {
      const mockList = [{ id: 1, name: 'Tower A' }];
      prisma.building.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('should return building if found', async () => {
      const mockBuilding = { id: 1, name: 'Tower A' };
      prisma.building.findUnique.mockResolvedValue(mockBuilding);

      const result = await service.findOne(1);

      expect(result).toEqual(mockBuilding);
    });

    it('should throw NotFoundException if building missing', async () => {
      prisma.building.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { siteId: 1, name: 'Tower A', wing: 'Wing B' };

    it('should create building if site exists', async () => {
      prisma.site.findUnique.mockResolvedValue({ id: 1, name: 'Site 1' });
      prisma.building.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 10);
      expect(prisma.building.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException if site does not exist', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { name: 'Tower A Updated' };

    it('should update building details', async () => {
      prisma.building.findUnique.mockResolvedValue({ id: 10, name: 'Tower A' });
      prisma.building.update.mockResolvedValue({ id: 10, name: 'Tower A Updated' });

      const result = await service.update(10, dto);

      expect(result).toHaveProperty('name', 'Tower A Updated');
    });

    it('should throw NotFoundException if building missing', async () => {
      prisma.building.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete building if no floors linked', async () => {
      prisma.building.findUnique.mockResolvedValue({ id: 10, name: 'Tower A' });
      prisma.floor.count.mockResolvedValue(0);
      prisma.building.delete.mockResolvedValue({ id: 10 });

      const result = await service.delete(10);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw ConflictException if floors are linked', async () => {
      prisma.building.findUnique.mockResolvedValue({ id: 10, name: 'Tower A' });
      prisma.floor.count.mockResolvedValue(3);

      await expect(service.delete(10)).rejects.toThrow(ConflictException);
    });
  });
});
