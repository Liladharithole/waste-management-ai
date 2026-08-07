import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { FileResidentComplaintDto } from './dto/file-resident-complaint.dto';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

@Injectable()
export class ResidentPortalService {
  constructor(
    private readonly prismaMain: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  async getMyResidentProfile(userId: number) {
    const resident = await this.prismaCore.resident.findFirst({
      where: { userId, deletedAt: null },
      include: {
        unit: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!resident) {
      throw new NotFoundException(`No resident profile linked to User ID ${userId}.`);
    }

    return resident;
  }

  async getMyCollectionHistory(userId: number, page: number = 1, limit: number = 10) {
    const resident = await this.getMyResidentProfile(userId);
    const unitId = resident.unitId;

    const skip = (page - 1) * limit;
    const whereClause = { unitId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prismaMain.wasteCollection.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { collectionDate: 'desc' },
        include: {
          wasteCategory: true,
        },
      }),
      this.prismaMain.wasteCollection.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async getMyInvoices(userId: number, page: number = 1, limit: number = 10) {
    const resident = await this.getMyResidentProfile(userId);
    const unitId = resident.unitId;

    const skip = (page - 1) * limit;
    const whereClause = { unitId, deletedAt: null };

    const [data, total] = await Promise.all([
      this.prismaMain.wasteInvoice.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
        },
      }),
      this.prismaMain.wasteInvoice.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async fileComplaint(userId: number, dto: FileResidentComplaintDto, auditUser?: string) {
    const resident = await this.getMyResidentProfile(userId).catch(() => null);

    return await this.prismaMain.wasteComplaint.create({
      data: {
        complaintNumber: `CMP-${Date.now()}`,
        residentUserId: userId,
        unitId: dto.unitId || (resident ? resident.unitId : null),
        complaintType: dto.complaintType,
        title: dto.complaintType,
        description: dto.description,
        photoUrl: dto.photoUrl,
        status: ComplaintStatus.OPEN,
        priority: ComplaintPriority.MEDIUM,
        createdBy: auditUser,
      },
    });
  }

  async getMyComplaints(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const whereClause: any = {
      residentUserId: userId,
      deletedAt: null,
    };

    const [data, total] = await Promise.all([
      this.prismaMain.wasteComplaint.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaMain.wasteComplaint.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }
}
