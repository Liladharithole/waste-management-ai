import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDispatchDto } from '../dto/create-dispatch.dto';
import { UpdateDispatchStatusDto } from '../dto/update-dispatch-status.dto';
import { CreateStopLogDto } from '../dto/create-stop-log.dto';
import { DispatchQueryDto } from '../dto/dispatch-query.dto';
import { DispatchStatus } from '@prisma/client';

@Injectable()
export class DispatchesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDispatchDto, auditUser?: string) {
    return await this.prisma.dispatchAssignment.create({
      data: {
        scheduleId: dto.scheduleId,
        vehicleId: dto.vehicleId,
        driverEmployeeId: dto.driverEmployeeId,
        helperEmployeeId: dto.helperEmployeeId,
        dispatchDate: new Date(dto.dispatchDate),
        shiftName: dto.shiftName || 'MORNING',
        status: DispatchStatus.ASSIGNED,
        remarks: dto.remarks,
        createdBy: auditUser,
      },
      include: {
        vehicle: true,
        schedule: true,
      },
    });
  }

  async findAll(query: DispatchQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.driverEmployeeId ? { driverEmployeeId: query.driverEmployeeId } : {}),
      ...(query.scheduleId ? { scheduleId: query.scheduleId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.dispatchDate ? { dispatchDate: new Date(query.dispatchDate) } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.dispatchAssignment.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { dispatchDate: 'desc' },
        include: {
          vehicle: true,
          schedule: true,
          _count: {
            select: { stopLogs: true },
          },
        },
      }),
      this.prisma.dispatchAssignment.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: number) {
    return await this.prisma.dispatchAssignment.findFirst({
      where: { id, deletedAt: null },
      include: {
        vehicle: true,
        schedule: true,
        stopLogs: {
          orderBy: { arrivalTime: 'asc' },
        },
      },
    });
  }

  async updateStatus(id: number, dto: UpdateDispatchStatusDto, auditUser?: string) {
    const updateData: any = {
      status: dto.status,
      updatedBy: auditUser,
    };

    if (dto.status === DispatchStatus.STARTED) {
      updateData.startedAt = new Date();
      if (dto.startOdometerKm !== undefined) {
        updateData.startOdometerKm = dto.startOdometerKm;
      }
    } else if (dto.status === DispatchStatus.COMPLETED) {
      updateData.completedAt = new Date();
      if (dto.endOdometerKm !== undefined) {
        updateData.endOdometerKm = dto.endOdometerKm;
      }
    }

    if (dto.remarks) {
      updateData.remarks = dto.remarks;
    }

    return await this.prisma.dispatchAssignment.update({
      where: { id },
      data: updateData,
      include: {
        vehicle: true,
        schedule: true,
      },
    });
  }

  async addStopLog(dispatchId: number, dto: CreateStopLogDto, auditUser?: string) {
    return await this.prisma.dispatchStopLog.create({
      data: {
        dispatchId,
        siteId: dto.siteId,
        unitId: dto.unitId,
        collectedWeightKg: dto.collectedWeightKg,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: dto.status || 'COMPLETED',
        skipReason: dto.skipReason,
        createdBy: auditUser,
      },
    });
  }

  async findOverlappingDispatch(
    vehicleId: number,
    driverEmployeeId: number,
    dispatchDate: Date,
    shiftName: string,
  ) {
    return await this.prisma.dispatchAssignment.findFirst({
      where: {
        deletedAt: null,
        dispatchDate,
        shiftName,
        status: {
          notIn: [DispatchStatus.CANCELLED, DispatchStatus.COMPLETED],
        },
        OR: [{ vehicleId }, { driverEmployeeId }],
      },
    });
  }
}
