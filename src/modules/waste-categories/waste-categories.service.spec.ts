import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { WasteCategoriesService } from './waste-categories.service';
import { WasteCategoriesRepository } from './repositories/waste-categories.repository';

describe('WasteCategoriesService', () => {
  let service: WasteCategoriesService;
  let repository: any;

  const mockRepository = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
    countLinkedCollections: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WasteCategoriesService,
        { provide: WasteCategoriesRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<WasteCategoriesService>(WasteCategoriesService);
    repository = module.get<WasteCategoriesRepository>(WasteCategoriesRepository);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated waste categories', async () => {
      const mockList = [{ id: 1, name: 'Organic Waste' }];
      mockRepository.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return category if found', async () => {
      const mockCategory = { id: 1, name: 'Organic Waste' };
      mockRepository.findById.mockResolvedValue(mockCategory);

      const result = await service.findOne(1);

      expect(result).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category missing or deleted', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.findOne(1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const dto = { name: 'Plastic Waste', description: 'Recyclable plastics' };

    it('should create waste category if name unique', async () => {
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ id: 2, ...dto });

      const result = await service.create(dto, 'admin@example.com');

      expect(result).toHaveProperty('id', 2);
      expect(mockRepository.create).toHaveBeenCalledWith(dto, 'admin@example.com');
    });

    it('should throw ConflictException if category name exists', async () => {
      mockRepository.findByName.mockResolvedValue({ id: 1, name: 'Plastic Waste' });

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    const dto = { name: 'Dry Recyclables' };

    it('should update category details', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, name: 'Plastics' });
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue({ id: 1, name: 'Dry Recyclables' });

      const result = await service.update(1, dto, 'admin@example.com');

      expect(result).toHaveProperty('name', 'Dry Recyclables');
    });
  });

  describe('delete', () => {
    it('should soft delete category if no linked collections', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, name: 'Plastics' });
      mockRepository.countLinkedCollections.mockResolvedValue(0);
      mockRepository.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const result = await service.delete(1, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
    });

    it('should throw ConflictException if collections are linked', async () => {
      mockRepository.findById.mockResolvedValue({ id: 1, name: 'Plastics' });
      mockRepository.countLinkedCollections.mockResolvedValue(5);

      await expect(service.delete(1)).rejects.toThrow(ConflictException);
    });
  });
});
