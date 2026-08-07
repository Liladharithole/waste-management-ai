import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateScheduleDto } from '../dto/create-schedule.dto';
import { UpdateScheduleDto } from '../dto/update-schedule.dto';
import { ScheduleQueryDto } from '../dto/schedule-query.dto';

@Injectable()
export class SchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ScheduleQueryDto) {
    const {
      page = 1,
      limit = 10,
      siteId,
      buildingId,
      wasteCategoryId,
      assignedEmployeeId,
      frequency,
      isActive,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(siteId ? { siteId } : {}),
      ...(buildingId ? { buildingId } : {}),
      ...(wasteCategoryId ? { wasteCategoryId } : {}),
      ...(assignedEmployeeId ? { assignedEmployeeId } : {}),
      ...(frequency ? { frequency } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search
        ? {
            OR: [{ name: { contains: search } }],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteSchedule.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          wasteCategory: true,
        },
        orderBy: { startTime: 'asc' },
      }),
      this.prisma.wasteSchedule.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteSchedule.findUnique({
      where: { id },
      include: {
        wasteCategory: true,
      },
    });
  }

  async findActiveSchedulesForDriverOrSite(siteId?: number, assignedEmployeeId?: number) {
    return await this.prisma.wasteSchedule.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(siteId ? { siteId } : {}),
        ...(assignedEmployeeId ? { assignedEmployeeId } : {}),
      },
      include: {
        wasteCategory: true,
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(dto: CreateScheduleDto, createdBy?: string) {
    return await this.prisma.wasteSchedule.create({
      data: {
        name: dto.name,
        siteId: dto.siteId,
        buildingId: dto.buildingId || null,
        assignedEmployeeId: dto.assignedEmployeeId || null,
        wasteCategoryId: dto.wasteCategoryId,
        frequency: dto.frequency || 'CUSTOM_DAYS',
        daysOfWeek: dto.daysOfWeek,
        startTime: dto.startTime,
        endTime: dto.endTime,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdBy: createdBy || 'SYSTEM',
      },
      include: {
        wasteCategory: true,
      },
    });
  }

  async update(id: number, dto: UpdateScheduleDto, updatedBy?: string) {
    return await this.prisma.wasteSchedule.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.siteId !== undefined ? { siteId: dto.siteId } : {}),
        ...(dto.buildingId !== undefined ? { buildingId: dto.buildingId } : {}),
        ...(dto.assignedEmployeeId !== undefined
          ? { assignedEmployeeId: dto.assignedEmployeeId }
          : {}),
        ...(dto.wasteCategoryId !== undefined ? { wasteCategoryId: dto.wasteCategoryId } : {}),
        ...(dto.frequency !== undefined ? { frequency: dto.frequency } : {}),
        ...(dto.daysOfWeek !== undefined ? { daysOfWeek: dto.daysOfWeek } : {}),
        ...(dto.startTime !== undefined ? { startTime: dto.startTime } : {}),
        ...(dto.endTime !== undefined ? { endTime: dto.endTime } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
      include: {
        wasteCategory: true,
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteSchedule.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
