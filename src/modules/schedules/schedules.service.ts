import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { SchedulesRepository } from './repositories/schedules.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { DailyChecklistQueryDto } from './dto/daily-checklist-query.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

@Injectable()
export class SchedulesService {
  private readonly DAYS_LIST = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];

  constructor(
    private readonly schedulesRepository: SchedulesRepository,
    private readonly wasteCategoriesRepository: WasteCategoriesRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  /**
   * Validates time window (startTime must be before endTime).
   */
  private validateTimeWindow(startTime: string, endTime: string) {
    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes >= endMinutes) {
      throw new BadRequestException(
        `Start time (${startTime}) must be strictly before end time (${endTime}).`,
      );
    }
  }

  /**
   * Retrieves paginated schedules with filters.
   */
  async findAll(query: ScheduleQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { data, total } = await this.schedulesRepository.findAll(query);
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single schedule by ID.
   */
  async findOne(id: number) {
    const schedule = await this.schedulesRepository.findById(id);
    if (!schedule || schedule.deletedAt) {
      throw new NotFoundException(`Pickup schedule with ID ${id} not found.`);
    }
    return schedule;
  }

  /**
   * Evaluates today's active driver route checklist.
   */
  async getDailyChecklist(query: DailyChecklistQueryDto) {
    const targetDate = query.date ? new Date(query.date) : new Date();
    const dayOfWeekName = this.DAYS_LIST[targetDate.getDay()]; // e.g., 'SATURDAY'

    const activeSchedules = await this.schedulesRepository.findActiveSchedulesForDriverOrSite(
      query.siteId,
      query.assignedEmployeeId,
    );

    // Filter schedules active on target day of week
    const todaysStops = activeSchedules.filter((schedule) => {
      if (schedule.frequency === 'DAILY') return true;

      const daysArr = Array.isArray(schedule.daysOfWeek) ? (schedule.daysOfWeek as string[]) : [];
      return daysArr.map((d) => d.toUpperCase()).includes(dayOfWeekName);
    });

    return {
      targetDate: targetDate.toISOString().slice(0, 10),
      dayOfWeek: dayOfWeekName,
      totalStopsCount: todaysStops.length,
      stops: todaysStops,
    };
  }

  /**
   * Creates a new pickup schedule.
   */
  async create(dto: CreateScheduleDto, createdBy?: string) {
    this.validateTimeWindow(dto.startTime, dto.endTime);

    // 1. Cross-DB validation: Check site exists in central_core_db
    const site = await this.prismaCore.site.findUnique({
      where: { id: dto.siteId },
    });
    if (!site || site.deletedAt) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
    }

    // 2. Cross-DB validation: If buildingId provided, check building exists in central_core_db
    if (dto.buildingId) {
      const building = await this.prismaCore.building.findUnique({
        where: { id: dto.buildingId },
      });
      if (!building || building.deletedAt) {
        throw new NotFoundException(`Building with ID ${dto.buildingId} not found.`);
      }
    }

    // 3. Cross-DB validation: If assignedEmployeeId provided, check user exists in central_core_db
    if (dto.assignedEmployeeId) {
      const employeeUser = await this.prismaCore.user.findUnique({
        where: { id: dto.assignedEmployeeId },
      });
      if (!employeeUser || employeeUser.deletedAt) {
        throw new NotFoundException(
          `Assigned employee user with ID ${dto.assignedEmployeeId} not found.`,
        );
      }
    }

    // 4. Same-DB validation: Check waste category exists in waste_management DB
    const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
    }

    return await this.schedulesRepository.create(dto, createdBy);
  }

  /**
   * Updates an existing schedule.
   */
  async update(id: number, dto: UpdateScheduleDto, updatedBy?: string) {
    const existing = await this.findOne(id);

    const startTime = dto.startTime || existing.startTime;
    const endTime = dto.endTime || existing.endTime;
    this.validateTimeWindow(startTime, endTime);

    if (dto.siteId) {
      const site = await this.prismaCore.site.findUnique({
        where: { id: dto.siteId },
      });
      if (!site || site.deletedAt) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
      }
    }

    if (dto.buildingId) {
      const building = await this.prismaCore.building.findUnique({
        where: { id: dto.buildingId },
      });
      if (!building || building.deletedAt) {
        throw new NotFoundException(`Building with ID ${dto.buildingId} not found.`);
      }
    }

    if (dto.assignedEmployeeId) {
      const employeeUser = await this.prismaCore.user.findUnique({
        where: { id: dto.assignedEmployeeId },
      });
      if (!employeeUser || employeeUser.deletedAt) {
        throw new NotFoundException(
          `Assigned employee user with ID ${dto.assignedEmployeeId} not found.`,
        );
      }
    }

    if (dto.wasteCategoryId) {
      const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
      if (!category || category.deletedAt) {
        throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
      }
    }

    return await this.schedulesRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes a schedule.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);
    return await this.schedulesRepository.softDelete(id, deletedBy);
  }
}
