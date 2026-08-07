import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { EmployeesRepository } from './repositories/employees.repository';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let repository: any;

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findByEmployeeCode: jest.fn(),
    findUserById: jest.fn(),
    findOrganizationById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmployeesService, { provide: EmployeesRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    repository = module.get<EmployeesRepository>(EmployeesRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated employee records', async () => {
      const mockList = [{ id: 1, userId: 10, organizationId: 2, designation: 'Collector' }];
      mockRepository.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10, undefined);
    });
  });

  describe('findOne', () => {
    it('should return employee record if found', async () => {
      const mockRecord = { id: 1, userId: 10, organizationId: 2 };
      mockRepository.findById.mockResolvedValue(mockRecord);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException if employee record missing or deleted', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { userId: 10, organizationId: 2, employeeCode: 'EMP-01', designation: 'Driver' };

    it('should create employee record if user and org exist', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findOrganizationById.mockResolvedValue({ id: 2 });
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByEmployeeCode.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockRepository.create).toHaveBeenCalledWith(dto, 'admin@example.com');
    });

    it('should throw NotFoundException if user missing', async () => {
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if organization missing', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findOrganizationById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already hired', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findOrganizationById.mockResolvedValue({ id: 2 });
      mockRepository.findByUserId.mockResolvedValue({ id: 5, userId: 10, organizationId: 1 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException if employeeCode already in use', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findOrganizationById.mockResolvedValue({ id: 2 });
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.findByEmployeeCode.mockResolvedValue({ id: 9, employeeCode: 'EMP-01' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto = { designation: 'Senior Driver' };

    it('should update employee record', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, userId: 10, organizationId: 2 });
      mockRepository.update.mockResolvedValue({
        id: 1,
        userId: 10,
        organizationId: 2,
        designation: 'Senior Driver',
      });

      const result = await service.update(1, dto, 'admin@example.com');

      expect(result).toHaveProperty('designation', 'Senior Driver');
    });
  });

  describe('delete', () => {
    it('should soft delete employee record', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, userId: 10, organizationId: 2 });
      mockRepository.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const result = await service.delete(1, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1, 'admin@example.com');
    });
  });
});
