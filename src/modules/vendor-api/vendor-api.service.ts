import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VendorApiService {
  constructor(private readonly prismaMain: PrismaService) {}

  async getWasteMetrics() {
    const collections = await this.prismaMain.wasteCollection.findMany({
      where: { deletedAt: null },
      include: { wasteCategory: true },
    });

    const totalWeightKg = collections.reduce((sum, c) => sum + (c.weight || 0), 0);

    const categoryBreakdownMap = new Map<string, number>();
    for (const c of collections) {
      const catName = c.wasteCategory?.name || 'Uncategorized';
      categoryBreakdownMap.set(catName, (categoryBreakdownMap.get(catName) || 0) + (c.weight || 0));
    }

    const categoryBreakdown = Array.from(categoryBreakdownMap.entries()).map(
      ([category, weightKg]) => ({
        category,
        weightKg: Math.round(weightKg * 100) / 100,
        weightTons: Math.round((weightKg / 1000) * 100) / 100,
      }),
    );

    return {
      partnerPortal: 'Municipal & Vendor Partner Gateway',
      totalCollectionsCount: collections.length,
      totalWeightKg: Math.round(totalWeightKg * 100) / 100,
      totalWeightTons: Math.round((totalWeightKg / 1000) * 100) / 100,
      categoryBreakdown,
      timestamp: new Date().toISOString(),
    };
  }

  async getFleetStatus() {
    const vehicles = await this.prismaMain.wasteVehicle.findMany({
      where: { deletedAt: null },
    });

    const activeCount = vehicles.filter((v) => v.status === 'ACTIVE').length;
    const maintenanceCount = vehicles.filter((v) => v.status === 'UNDER_MAINTENANCE').length;
    const compliantCount = vehicles.filter((v) => v.complianceStatus === 'COMPLIANT').length;
    const nonCompliantCount = vehicles.filter((v) => v.complianceStatus === 'NON_COMPLIANT').length;

    return {
      totalVehiclesCount: vehicles.length,
      statusBreakdown: {
        active: activeCount,
        underMaintenance: maintenanceCount,
        compliant: compliantCount,
        nonCompliant: nonCompliantCount,
      },
      vehicles: vehicles.map((v) => ({
        id: v.id,
        registrationNumber: v.registrationNumber,
        vehicleType: v.vehicleType,
        status: v.status,
        complianceStatus: v.complianceStatus,
      })),
      timestamp: new Date().toISOString(),
    };
  }
}
