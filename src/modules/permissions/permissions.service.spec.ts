import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PermissionsService } from './permissions.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let prisma: any;

  const mockPrisma = {
    permission: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    rolePermission: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PermissionsService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all permissions sorted by name', async () => {
      const mockList = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
      ];
      prisma.permission.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
      expect(prisma.permission.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    const dto = { name: 'test:permission', description: 'desc' };

    it('should create new permission if name is unique', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);
      prisma.permission.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto);

      expect(prisma.permission.findUnique).toHaveBeenCalledWith({
        where: { name: dto.name },
      });
      expect(result).toHaveProperty('id', 1);
    });

    it('should throw ConflictException if permission name is already in use', async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: 1, name: dto.name });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('should successfully delete a permission if it exists and is not assigned to any roles', async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: 1, name: 'perm' });
      prisma.rolePermission.findMany.mockResolvedValue([]);
      prisma.permission.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(result).toHaveProperty('id', 1);
      expect(prisma.rolePermission.findMany).toHaveBeenCalledWith({
        where: { permissionId: 1 },
        include: { role: true },
      });
    });

    it('should throw ConflictException if the permission is assigned to roles', async () => {
      prisma.permission.findUnique.mockResolvedValue({ id: 1, name: 'perm' });
      prisma.rolePermission.findMany.mockResolvedValue([{ id: 10, role: { name: 'SUPER_ADMIN' } }]);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if permission does not exist', async () => {
      prisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assign', () => {
    const dto = { roleId: 1, permissionId: 2 };

    it('should assign a permission to a role if valid', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'ROLE' });
      prisma.permission.findUnique.mockResolvedValue({ id: 2, name: 'PERM' });
      prisma.rolePermission.findUnique.mockResolvedValue(null);
      prisma.rolePermission.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.assign(dto);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw NotFoundException if role not found', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if permission not found', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1 });
      prisma.permission.findUnique.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if mapping already exists', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1 });
      prisma.permission.findUnique.mockResolvedValue({ id: 2 });
      prisma.rolePermission.findUnique.mockResolvedValue({ id: 10 });

      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('revoke', () => {
    const dto = { roleId: 1, permissionId: 2 };

    it('should successfully delete mapping if it exists', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue({ id: 10, ...dto });
      prisma.rolePermission.delete.mockResolvedValue({ id: 10 });

      const result = await service.revoke(dto);

      expect(result).toHaveProperty('id', 10);
    });

    it('should throw NotFoundException if mapping does not exist', async () => {
      prisma.rolePermission.findUnique.mockResolvedValue(null);

      await expect(service.revoke(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
