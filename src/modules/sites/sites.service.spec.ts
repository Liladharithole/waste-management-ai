import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SitesService } from './sites.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

describe('SitesService', () => {
  let service: SitesService;
  let prisma: any;
  let googleMaps: any;

  const mockGoogleMaps = {
    getAddressSuggestions: jest.fn(),
  };

  const mockPrisma = {
    organization: {
      findUnique: jest.fn(),
    },
    site: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    building: {
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SitesService,
        { provide: PrismaCentralCoreService, useValue: mockPrisma },
        { provide: GoogleMapsService, useValue: mockGoogleMaps },
      ],
    }).compile();

    service = module.get<SitesService>(SitesService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);
    googleMaps = module.get<GoogleMapsService>(GoogleMapsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated sites', async () => {
      const mockList = [{ id: 1, name: 'Green Valley' }];
      prisma.site.findMany.mockResolvedValue(mockList);
      prisma.site.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return site if found', async () => {
      const mockSite = { id: 1, name: 'Site A' };
      prisma.site.findUnique.mockResolvedValue(mockSite);

      const result = await service.findOne(1);

      expect(result).toEqual(mockSite);
    });

    it('should throw NotFoundException if site does not exist', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = {
      organizationId: 1,
      name: 'Gokuldham',
      addressLine1: 'Powai Road',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400076',
      latitude: 19.11,
      longitude: 72.9,
    };

    it('should create site if organization exists', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: 'Org 1' });
      prisma.site.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 10);
      expect(prisma.site.create).toHaveBeenCalledWith({ data: dto });
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const dto = { name: 'Gokuldham Society' };

    it('should update site details successfully', async () => {
      prisma.site.findUnique.mockResolvedValue({ id: 10, name: 'Gokuldham' });
      prisma.site.update.mockResolvedValue({ id: 10, name: 'Gokuldham Society' });

      const result = await service.update(10, dto);

      expect(result).toHaveProperty('name', 'Gokuldham Society');
    });

    it('should throw NotFoundException if site missing', async () => {
      prisma.site.findUnique.mockResolvedValue(null);

      await expect(service.update(10, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete site if no buildings are linked', async () => {
      prisma.site.findUnique.mockResolvedValue({ id: 10, name: 'Gokuldham' });
      prisma.building.count.mockResolvedValue(0);
      prisma.site.delete.mockResolvedValue({ id: 10 });

      const result = await service.delete(10);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw ConflictException if buildings are linked', async () => {
      prisma.site.findUnique.mockResolvedValue({ id: 10, name: 'Gokuldham' });
      prisma.building.count.mockResolvedValue(2);

      await expect(service.delete(10)).rejects.toThrow(ConflictException);
    });
  });

  describe('getAddressSuggestions', () => {
    it('should delegate request to GoogleMapsService', async () => {
      const mockResult = { suggestions: [] };
      mockGoogleMaps.getAddressSuggestions.mockResolvedValue(mockResult);

      const result = await service.getAddressSuggestions('Powai');

      expect(googleMaps.getAddressSuggestions).toHaveBeenCalledWith('Powai');
      expect(result).toEqual(mockResult);
    });
  });
});
