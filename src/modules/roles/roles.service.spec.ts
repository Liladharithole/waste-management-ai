import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RolesService } from './roles.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('RolesService', () => {
  let service: RolesService;
  let prisma: any;

  const mockPrisma = {
    role: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
    userRole: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaCentralCoreService, useValue: mockPrisma }],
    }).compile();

    service = module.get<RolesService>(RolesService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all roles sorted by name', async () => {
      const mockList = [
        { id: 1, name: 'ADMIN' },
        { id: 2, name: 'USER' },
      ];
      prisma.role.findMany.mockResolvedValue(mockList);

      const result = await service.findAll();

      expect(result).toEqual(mockList);
      expect(prisma.role.findMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
      });
    });
  });

  describe('create', () => {
    const dto = { name: 'test_role', description: 'desc' };

    it('should convert name to uppercase and create role if unique', async () => {
      prisma.role.findUnique.mockResolvedValue(null);
      prisma.role.create.mockResolvedValue({ id: 1, name: 'TEST_ROLE', description: 'desc' });

      const result = await service.create(dto);

      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'TEST_ROLE' },
      });
      expect(result).toHaveProperty('id', 1);
      expect(result).toHaveProperty('name', 'TEST_ROLE');
    });

    it('should throw ConflictException if role name already exists', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'TEST_ROLE' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto = { name: 'updated_role', description: 'new desc' };

    it('should update role name and description successfully', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'OLD_ROLE' });
      prisma.role.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'OLD_ROLE' })
        .mockResolvedValueOnce(null);
      prisma.role.update.mockResolvedValue({
        id: 1,
        name: 'UPDATED_ROLE',
        description: 'new desc',
      });

      const result = await service.update(1, dto);

      expect(result).toHaveProperty('name', 'UPDATED_ROLE');
    });

    it('should throw ConflictException if new name already exists', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'OLD_ROLE' });
      prisma.role.findUniqueOnce = prisma.role.findUnique
        .mockResolvedValueOnce({ id: 1, name: 'OLD_ROLE' })
        .mockResolvedValueOnce({ id: 2, name: 'UPDATED_ROLE' });

      await expect(service.update(1, dto)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if role to update does not exist', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.update(1, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should successfully delete role if exists and is not assigned to any users', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'ROLE' });
      prisma.userRole.findMany.mockResolvedValue([]);
      prisma.role.delete.mockResolvedValue({ id: 1 });

      const result = await service.delete(1);

      expect(result).toHaveProperty('id', 1);
      expect(prisma.userRole.findMany).toHaveBeenCalledWith({
        where: { roleId: 1 },
        include: { user: true },
      });
    });

    it('should throw ConflictException if role is assigned to users', async () => {
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'ROLE' });
      prisma.userRole.findMany.mockResolvedValue([{ id: 10, user: { email: 'user@example.com' } }]);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.delete(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('assign', () => {
    const dto = { userId: 1, roleId: 2 };

    it('should successfully assign role to user if mapping does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1, email: 'user@example.com' });
      prisma.role.findUnique.mockResolvedValue({ id: 2, name: 'ROLE' });
      prisma.userRole.findUnique.mockResolvedValue(null);
      prisma.userRole.create.mockResolvedValue({ id: 100, ...dto });

      const result = await service.assign(dto);

      expect(result).toHaveProperty('id', 100);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if role does not exist', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1 });
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.assign(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if role is already assigned to user', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1 });
      prisma.role.findUnique.mockResolvedValue({ id: 2 });
      prisma.userRole.findUnique.mockResolvedValue({ id: 100 });

      await expect(service.assign(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('revoke', () => {
    const dto = { userId: 1, roleId: 2 };

    it('should successfully delete role assignment if mapping exists', async () => {
      prisma.userRole.findUnique.mockResolvedValue({ id: 100, ...dto });
      prisma.userRole.delete.mockResolvedValue({ id: 100 });

      const result = await service.revoke(dto);

      expect(result).toHaveProperty('id', 100);
    });

    it('should throw NotFoundException if mapping does not exist', async () => {
      prisma.userRole.findUnique.mockResolvedValue(null);

      await expect(service.revoke(dto)).rejects.toThrow(NotFoundException);
    });
  });
});
