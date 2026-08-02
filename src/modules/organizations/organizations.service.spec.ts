import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrganizationsService } from './organizations.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

describe('OrganizationsService', () => {
  let service: OrganizationsService;
  let prisma: any;
  let googleMaps: any;

  const mockGoogleMaps = {
    getAddressSuggestions: jest.fn(),
  };

  const mockPrisma = {
    organization: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    organizationSettings: {
      create: jest.fn(),
    },
    organizationAddress: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    employee: {
      count: jest.fn(),
    },
    site: {
      count: jest.fn(),
    },
    $transaction: jest.fn((cb) => cb(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: PrismaCentralCoreService, useValue: mockPrisma },
        { provide: GoogleMapsService, useValue: mockGoogleMaps },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);
    googleMaps = module.get<GoogleMapsService>(GoogleMapsService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all active organizations sorted by name', async () => {
      const mockList = [{ id: 1, name: 'BMC' }];
      prisma.organization.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
      expect(prisma.organization.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    const dto = {
      name: 'BMC Mumbai',
      fullName: 'Brihanmumbai Municipal Corporation',
      shortName: 'BMC',
      type: 'GOVERNMENT',
      addressLine1: 'BMC HQ',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400001',
      latitude: 18.9401,
      longitude: 72.8348,
    };

    it('should successfully create an organization, settings, and address in a transaction', async () => {
      prisma.organization.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce({
        id: 1,
        name: dto.name,
        settings: { id: 10 },
        addresses: [{ id: 20 }],
      });
      prisma.organization.create.mockResolvedValue({ id: 1, name: dto.name });
      prisma.organizationSettings.create.mockResolvedValue({ id: 10 });
      prisma.organizationAddress.create.mockResolvedValue({ id: 20 });

      const result = await service.create(dto);

      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('settings');
      expect(result!.addresses).toHaveLength(1);
    });

    it('should throw ConflictException if organization name already exists', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: dto.name });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto = { name: 'PMC Pune' };

    it('should update organization details successfully', async () => {
      prisma.organization.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'BMC Mumbai' })
        .mockResolvedValueOnce(null);
      prisma.organization.update.mockResolvedValue({ id: 1, name: 'PMC Pune' });

      const result = await service.update(1, dto);

      expect(result).toHaveProperty('name', 'PMC Pune');
    });

    it('should throw NotFoundException if organization not found', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should successfully delete if no employees or sites are linked', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: 'BMC' });
      prisma.employee.count.mockResolvedValue(0);
      prisma.site.count.mockResolvedValue(0);
      prisma.organization.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(result).toHaveProperty('id', 1);
    });

    it('should throw ConflictException if employees are linked', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: 'BMC' });
      prisma.employee.count.mockResolvedValue(3);
      prisma.site.count.mockResolvedValue(0);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if sites are linked', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: 'BMC' });
      prisma.employee.count.mockResolvedValue(0);
      prisma.site.count.mockResolvedValue(2);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAddressSuggestions', () => {
    it('should forward getAddressSuggestions request to GoogleMapsService', async () => {
      const mockResult = { suggestions: [] };
      mockGoogleMaps.getAddressSuggestions.mockResolvedValue(mockResult);

      const result = await service.getAddressSuggestions('BMC');

      expect(googleMaps.getAddressSuggestions).toHaveBeenCalledWith('BMC');
      expect(result).toEqual(mockResult);
    });
  });

  describe('addAddress', () => {
    const dto = {
      addressLine1: '456 Alternate St',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400002',
      latitude: 19.0001,
      longitude: 72.9001,
      isDefault: true,
    };

    it('should successfully add a new address and clear other defaults if isDefault is true', async () => {
      prisma.organization.findUnique.mockResolvedValue({ id: 1, name: 'BMC' });
      prisma.organizationAddress.updateMany.mockResolvedValue({ count: 1 });
      prisma.organizationAddress.create.mockResolvedValue({ id: 2, ...dto });

      const result = await service.addAddress(1, dto);

      expect(result).toHaveProperty('id', 2);
      expect(prisma.organizationAddress.updateMany).toHaveBeenCalled();
      expect(prisma.organizationAddress.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if organization does not exist', async () => {
      prisma.organization.findUnique.mockResolvedValue(null);

      await expect(service.addAddress(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateAddress', () => {
    const dto = {
      addressLine1: '789 Updated St',
      isDefault: true,
    };

    it('should successfully update address and reset other defaults if isDefault is true', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue({
        id: 2,
        organizationId: 1,
        isDefault: false,
      });
      prisma.organizationAddress.updateMany.mockResolvedValue({ count: 1 });
      prisma.organizationAddress.update.mockResolvedValue({ id: 2, ...dto });

      const result = await service.updateAddress(1, 2, dto);

      expect(result).toHaveProperty('addressLine1', '789 Updated St');
      expect(prisma.organizationAddress.updateMany).toHaveBeenCalled();
    });

    it('should throw NotFoundException if address not found for organization', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue(null);

      await expect(service.updateAddress(1, 2, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAddress', () => {
    it('should successfully delete address if safety constraints are met', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue({
        id: 2,
        organizationId: 1,
        isDefault: false,
      });
      prisma.organizationAddress.count.mockResolvedValue(2);
      prisma.organizationAddress.delete.mockResolvedValue({ id: 2 });

      const result = await service.deleteAddress(1, 2);

      expect(result).toHaveProperty('id', 2);
    });

    it('should throw NotFoundException if address is missing', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue(null);

      await expect(service.deleteAddress(1, 2)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if trying to delete the only address', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue({
        id: 2,
        organizationId: 1,
        isDefault: false,
      });
      prisma.organizationAddress.count.mockResolvedValue(1);

      await expect(service.deleteAddress(1, 2)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if trying to delete a default address', async () => {
      prisma.organizationAddress.findFirst.mockResolvedValue({
        id: 2,
        organizationId: 1,
        isDefault: true,
      });
      prisma.organizationAddress.count.mockResolvedValue(3);

      await expect(service.deleteAddress(1, 2)).rejects.toThrow(ConflictException);
    });
  });
});
