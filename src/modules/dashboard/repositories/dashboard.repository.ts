import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { DashboardQueryDto } from '../dto/dashboard-query.dto';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class DashboardRepository {
  constructor(
    private readonly prismaMain: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  async getWasteCollectionStats(query: DashboardQueryDto) {
    const whereClause: any = {
      deletedAt: null,
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.startDate || query.endDate
        ? {
            collectionDate: {
              ...(query.startDate ? { gte: new Date(query.startDate) } : {}),
              ...(query.endDate ? { lte: new Date(query.endDate) } : {}),
            },
          }
        : {}),
    };

    const [totalCollections, weightAgg, categoryGroup] = await Promise.all([
      this.prismaMain.wasteCollection.count({ where: whereClause }),
      this.prismaMain.wasteCollection.aggregate({
        where: whereClause,
        _sum: { weight: true },
      }),
      this.prismaMain.wasteCollection.groupBy({
        by: ['wasteCategoryId'],
        where: whereClause,
        _sum: { weight: true },
        _count: { _all: true },
      }),
    ]);

    const categories = await this.prismaMain.wasteCategory.findMany({
      where: { deletedAt: null },
    });

    const categoryBreakdown = categoryGroup.map((grp) => {
      const cat = categories.find((c) => c.id === grp.wasteCategoryId);
      const totalKg = grp._sum?.weight || 0;
      const count = typeof grp._count === 'number' ? grp._count : grp._count?._all || 0;
      return {
        wasteCategoryId: grp.wasteCategoryId,
        categoryName: cat ? cat.name : 'Unknown',
        totalWeightKg: Math.round(totalKg * 100) / 100,
        totalWeightMetricTons: Math.round((totalKg / 1000) * 1000) / 1000,
        collectionCount: count,
      };
    });

    const totalWeightKg = weightAgg._sum?.weight || 0;

    return {
      totalCollections,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      totalWeightMetricTons: Math.round((totalWeightKg / 1000) * 1000) / 1000,
      categoryBreakdown,
    };
  }

  async getFleetComplianceStats(organizationId?: number) {
    const whereVehicle: any = {
      deletedAt: null,
      ...(organizationId ? { organizationId } : {}),
    };

    const [
      totalVehicles,
      compliantVehicles,
      nonCompliantVehicles,
      totalDrivers,
      compliantDrivers,
      nonCompliantDrivers,
    ] = await Promise.all([
      this.prismaMain.wasteVehicle.count({ where: whereVehicle }),
      this.prismaMain.wasteVehicle.count({
        where: { ...whereVehicle, complianceStatus: 'COMPLIANT' as any },
      }),
      this.prismaMain.wasteVehicle.count({
        where: { ...whereVehicle, complianceStatus: 'NON_COMPLIANT' as any },
      }),
      this.prismaCore.employee.count({
        where: { deletedAt: null, ...(organizationId ? { organizationId } : {}) },
      }),
      this.prismaCore.employee.count({
        where: {
          deletedAt: null,
          ...(organizationId ? { organizationId } : {}),
          complianceStatus: 'COMPLIANT',
        },
      }),
      this.prismaCore.employee.count({
        where: {
          deletedAt: null,
          ...(organizationId ? { organizationId } : {}),
          complianceStatus: 'NON_COMPLIANT',
        },
      }),
    ]);

    const vehicleComplianceRate =
      totalVehicles > 0 ? Math.round((compliantVehicles / totalVehicles) * 100) : 100;
    const driverComplianceRate =
      totalDrivers > 0 ? Math.round((compliantDrivers / totalDrivers) * 100) : 100;

    return {
      vehicles: {
        total: totalVehicles,
        compliant: compliantVehicles,
        nonCompliant: nonCompliantVehicles,
        complianceRatePercentage: vehicleComplianceRate,
      },
      drivers: {
        total: totalDrivers,
        compliant: compliantDrivers,
        nonCompliant: nonCompliantDrivers,
        complianceRatePercentage: driverComplianceRate,
      },
    };
  }

  async getBillingFinancialStats(organizationId?: number) {
    const whereClause: any = {
      deletedAt: null,
      ...(organizationId ? { organizationId } : {}),
    };

    const statusGroup = await this.prismaMain.wasteInvoice.groupBy({
      by: ['status'],
      where: whereClause,
      _sum: { totalAmount: true },
      _count: { _all: true },
    });

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    let totalDraft = 0;

    const breakdownByStatus = statusGroup.map((grp) => {
      const amount = grp._sum?.totalAmount || 0;
      const count = typeof grp._count === 'number' ? grp._count : grp._count?._all || 0;

      totalInvoiced += amount;
      if (grp.status === InvoiceStatus.PAID) totalPaid += amount;
      if (grp.status === InvoiceStatus.OVERDUE) totalOverdue += amount;
      if (grp.status === InvoiceStatus.DRAFT) totalDraft += amount;

      return {
        status: grp.status,
        count,
        totalAmount: Math.round(amount * 100) / 100,
      };
    });

    return {
      summary: {
        totalInvoicedAmount: Math.round(totalInvoiced * 100) / 100,
        totalPaidAmount: Math.round(totalPaid * 100) / 100,
        totalOverdueAmount: Math.round(totalOverdue * 100) / 100,
        totalDraftAmount: Math.round(totalDraft * 100) / 100,
      },
      breakdownByStatus,
    };
  }
}
