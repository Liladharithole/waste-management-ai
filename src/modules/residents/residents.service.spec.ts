import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ResidentsService } from './residents.service';
import { ResidentsRepository } from './repositories/residents.repository';

describe('ResidentsService', () => {
  let service: ResidentsService;
  let repository: any;

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByUserId: jest.fn(),
    findUserById: jest.fn(),
    findUnitById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ResidentsService, { provide: ResidentsRepository, useValue: mockRepository }],
    }).compile();

    service = module.get<ResidentsService>(ResidentsService);
    repository = module.get<ResidentsRepository>(ResidentsRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated resident records', async () => {
      const mockList = [{ id: 1, userId: 10, unitId: 20 }];
      mockRepository.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
      expect(mockRepository.findAll).toHaveBeenCalledWith(undefined, 1, 10, undefined);
    });
  });

  describe('findOne', () => {
    it('should return resident record if found', async () => {
      const mockRecord = { id: 1, userId: 10, unitId: 20 };
      mockRepository.findById.mockResolvedValue(mockRecord);

      const result = await service.findOne(1);

      expect(result).toEqual(mockRecord);
    });

    it('should throw NotFoundException if resident record missing or deleted', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { userId: 10, unitId: 20 };

    it('should create resident record if user and unit exist', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findUnitById.mockResolvedValue({ id: 20 });
      mockRepository.findByUserId.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockRepository.create).toHaveBeenCalledWith(dto, 'admin@example.com');
    });

    it('should throw NotFoundException if user missing', async () => {
      mockRepository.findUserById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if unit missing', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findUnitById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user already assigned as resident', async () => {
      mockRepository.findUserById.mockResolvedValue({ id: 10 });
      mockRepository.findUnitById.mockResolvedValue({ id: 20 });
      mockRepository.findByUserId.mockResolvedValue({ id: 2, userId: 10, unitId: 15 });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto = { unitId: 25 };

    it('should update resident record', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, userId: 10, unitId: 20 });
      mockRepository.findUnitById.mockResolvedValue({ id: 25 });
      mockRepository.update.mockResolvedValue({ id: 1, userId: 10, unitId: 25 });

      const result = await service.update(1, dto, 'admin@example.com');

      expect(result).toHaveProperty('unitId', 25);
    });
  });

  describe('delete', () => {
    it('should soft delete resident record', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, userId: 10, unitId: 20 });
      mockRepository.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const result = await service.delete(1, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(1, 'admin@example.com');
    });
  });
});
