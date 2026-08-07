import { Injectable } from '@nestjs/common';
import { ComplaintStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateComplaintDto } from '../dto/create-complaint.dto';
import { UpdateComplaintDto } from '../dto/update-complaint.dto';
import { ComplaintQueryDto } from '../dto/complaint-query.dto';

@Injectable()
export class ComplaintsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ComplaintQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      residentUserId,
      assignedEmployeeId,
      unitId,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(residentUserId ? { residentUserId } : {}),
      ...(assignedEmployeeId ? { assignedEmployeeId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(search
        ? {
            OR: [
              { complaintNumber: { contains: search } },
              { title: { contains: search } },
              { description: { contains: search } },
              { complaintType: { contains: search } },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteComplaint.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteComplaint.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteComplaint.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateComplaintDto, complaintNumber: string, createdBy?: string) {
    return await this.prisma.wasteComplaint.create({
      data: {
        complaintNumber,
        residentUserId: dto.residentUserId,
        unitId: dto.unitId || null,
        complaintType: dto.complaintType,
        title: dto.title,
        description: dto.description || null,
        photoUrl: dto.photoUrl || null,
        priority: dto.priority || 'MEDIUM',
        status: ComplaintStatus.OPEN,
        createdBy: createdBy || 'SYSTEM',
      },
    });
  }

  async update(id: number, dto: UpdateComplaintDto, updatedBy?: string) {
    const isResolving =
      dto.status === ComplaintStatus.RESOLVED || dto.status === ComplaintStatus.CLOSED;

    return await this.prisma.wasteComplaint.update({
      where: { id },
      data: {
        ...(dto.residentUserId !== undefined ? { residentUserId: dto.residentUserId } : {}),
        ...(dto.unitId !== undefined ? { unitId: dto.unitId } : {}),
        ...(dto.assignedEmployeeId !== undefined
          ? { assignedEmployeeId: dto.assignedEmployeeId }
          : {}),
        ...(dto.complaintType !== undefined ? { complaintType: dto.complaintType } : {}),
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.resolutionNotes !== undefined ? { resolutionNotes: dto.resolutionNotes } : {}),
        ...(dto.resolutionPhotoUrl !== undefined
          ? { resolutionPhotoUrl: dto.resolutionPhotoUrl }
          : {}),
        ...(isResolving ? { resolvedAt: new Date() } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteComplaint.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
