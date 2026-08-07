import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SchedulesService } from './schedules.service';
import { SchedulesRepository } from './repositories/schedules.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { ScheduleFrequency } from '@prisma/client';

describe('SchedulesService', () => {
  let service: SchedulesService;

  const mockSchedulesRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActiveSchedulesForDriverOrSite: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCategoriesRepo = {
    findById: jest.fn(),
  };

  const mockPrismaCore = {
    site: {
      findUnique: jest.fn(),
    },
    building: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: SchedulesRepository, useValue: mockSchedulesRepo },
        { provide: WasteCategoriesRepository, useValue: mockCategoriesRepo },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);

    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated schedules', async () => {
      const mockList = [{ id: 1, name: 'Morning Organic' }];
      mockSchedulesRepo.findAll.mockResolvedValue({ data: mockList, total: 1 });

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockList);
      expect(result.meta.total).toBe(1);
    });
  });

  describe('create (Validation & Edge cases)', () => {
    const dto = {
      name: 'Morning Organic Pickup',
      siteId: 1,
      buildingId: 3,
      assignedEmployeeId: 10,
      wasteCategoryId: 1,
      frequency: ScheduleFrequency.CUSTOM_DAYS,
      daysOfWeek: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
      startTime: '07:00',
      endTime: '09:00',
    };

    it('should create schedule if all relations exist and time is valid', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaCore.building.findUnique.mockResolvedValue({ id: 3 });
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 10 });
      mockCategoriesRepo.findById.mockResolvedValue({ id: 1, name: 'Organic' });
      mockSchedulesRepo.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.create(dto, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
      expect(mockSchedulesRepo.create).toHaveBeenCalled();
    });

    it('REAL-WORLD EDGE CASE: should throw BadRequestException if startTime is after or equal to endTime', async () => {
      const invalidDto = { ...dto, startTime: '10:00', endTime: '08:00' };

      await expect(service.create(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if site missing', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if building missing', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaCore.building.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if assigned employee missing', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaCore.building.findUnique.mockResolvedValue({ id: 3 });
      mockPrismaCore.user.findUnique.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if category missing', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1 });
      mockPrismaCore.building.findUnique.mockResolvedValue({ id: 3 });
      mockPrismaCore.user.findUnique.mockResolvedValue({ id: 10 });
      mockCategoriesRepo.findById.mockResolvedValue(null);

      await expect(service.create(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDailyChecklist', () => {
    it('should filter driver route stops matching target day of week', async () => {
      const mockSchedules = [
        {
          id: 1,
          name: 'Saturday Recyclables',
          frequency: ScheduleFrequency.CUSTOM_DAYS,
          daysOfWeek: ['SATURDAY'],
          startTime: '08:00',
          endTime: '10:00',
          isActive: true,
        },
        {
          id: 2,
          name: 'Monday Organic',
          frequency: ScheduleFrequency.CUSTOM_DAYS,
          daysOfWeek: ['MONDAY'],
          startTime: '08:00',
          endTime: '10:00',
          isActive: true,
        },
      ];
      mockSchedulesRepo.findActiveSchedulesForDriverOrSite.mockResolvedValue(mockSchedules);

      // Target date: 2026-08-08 is a Saturday
      const result = await service.getDailyChecklist({
        assignedEmployeeId: 10,
        date: '2026-08-08',
      });

      expect(result.dayOfWeek).toBe('SATURDAY');
      expect(result.totalStopsCount).toBe(1);
      expect(result.stops[0].name).toBe('Saturday Recyclables');
    });
  });

  describe('delete', () => {
    it('should soft delete schedule record', async () => {
      mockSchedulesRepo.findById.mockResolvedValue({ id: 1 });
      mockSchedulesRepo.softDelete.mockResolvedValue({ id: 1, deletedAt: new Date() });

      const result = await service.delete(1, 'admin@example.com');

      expect(result).toHaveProperty('id', 1);
    });
  });
});
