import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { WasteSummaryQueryDto } from '../dto/waste-summary-query.dto';
import { SlaQueryDto } from '../dto/sla-query.dto';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getCollectionAggregates(query: WasteSummaryQueryDto) {
    const { startDate, endDate, wasteCategoryId } = query;

    const whereClause: any = {
      deletedAt: null,
      ...(wasteCategoryId ? { wasteCategoryId } : {}),
      ...(startDate || endDate
        ? {
            collectionDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const collections = await this.prisma.wasteCollection.findMany({
      where: whereClause,
      select: {
        id: true,
        weight: true,
        wasteCategoryId: true,
        wasteCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return collections;
  }

  async getComplaintsAggregates(query: SlaQueryDto) {
    const { startDate, endDate } = query;

    const whereClause: any = {
      deletedAt: null,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const complaints = await this.prisma.wasteComplaint.findMany({
      where: whereClause,
      select: {
        id: true,
        complaintNumber: true,
        status: true,
        priority: true,
        createdAt: true,
        resolvedAt: true,
        residentUserId: true,
        assignedEmployeeId: true,
      },
    });

    return complaints;
  }

  async getWorkerPerformanceStats() {
    const collectionsGrouped = await this.prisma.wasteCollection.groupBy({
      by: ['collectorUserId'],
      where: { deletedAt: null },
      _count: { id: true },
      _sum: { weight: true },
    });

    const complaintsResolvedGrouped = await this.prisma.wasteComplaint.groupBy({
      by: ['assignedEmployeeId'],
      where: {
        deletedAt: null,
        status: { in: ['RESOLVED', 'CLOSED'] },
        assignedEmployeeId: { not: null },
      },
      _count: { id: true },
    });

    return { collectionsGrouped, complaintsResolvedGrouped };
  }

  async getInvoicesForAging() {
    return this.prisma.wasteInvoice.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        invoiceNumber: true,
        totalAmount: true,
        status: true,
        dueDate: true,
        paidAt: true,
        siteId: true,
        organizationId: true,
      },
    });
  }

  async getCompletedDispatchesWithLogs() {
    return this.prisma.dispatchAssignment.findMany({
      where: { deletedAt: null, status: 'COMPLETED' },
      include: {
        vehicle: true,
        stopLogs: true,
      },
    });
  }

  async getDispatchesWithSchedules() {
    return this.prisma.dispatchAssignment.findMany({
      where: { deletedAt: null },
      include: {
        schedule: true,
        stopLogs: true,
      },
    });
  }
}
