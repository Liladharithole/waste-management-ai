import { Injectable } from '@nestjs/common';
import { ReportsRepository } from './repositories/reports.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { WasteSummaryQueryDto } from './dto/waste-summary-query.dto';
import { SlaQueryDto } from './dto/sla-query.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly reportsRepository: ReportsRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  /**
   * Calculates CO2 Carbon Offset in kg based on waste weight and category type.
   */
  private calculateCo2Offset(weightInKg: number, categoryName: string): number {
    const lowerName = categoryName.toLowerCase();
    let co2Factor = 0.3; // Default baseline CO2 factor (kg CO2 per kg waste)

    if (lowerName.includes('organic') || lowerName.includes('wet')) {
      co2Factor = 0.5;
    } else if (
      lowerName.includes('recycle') ||
      lowerName.includes('dry') ||
      lowerName.includes('plastic')
    ) {
      co2Factor = 1.2;
    } else if (
      lowerName.includes('e-waste') ||
      lowerName.includes('hazard') ||
      lowerName.includes('electronic')
    ) {
      co2Factor = 2.5;
    }

    return parseFloat((weightInKg * co2Factor).toFixed(2));
  }

  /**
   * Evaluates the active SLA threshold hours (in 3-tier hierarchy: Site -> Organization -> System Default).
   */
  private async resolveSlaThresholds(
    siteId?: number,
    organizationId?: number,
  ): Promise<{ highPriorityHours: number; lowPriorityHours: number; source: string }> {
    // Tier 1: Check Site-specific settings
    if (siteId) {
      const siteSettings = await this.prismaCore.siteSettings.findUnique({
        where: { siteId },
      });
      if (siteSettings) {
        return {
          highPriorityHours: siteSettings.highPrioritySlaHours,
          lowPriorityHours: siteSettings.lowPrioritySlaHours,
          source: `SITE_${siteId}`,
        };
      }
    }

    // Tier 2: Check Organization-specific settings
    if (organizationId) {
      const orgSettings = await this.prismaCore.organizationSettings.findUnique({
        where: { organizationId },
      });
      if (orgSettings) {
        return {
          highPriorityHours: orgSettings.highPrioritySlaHours,
          lowPriorityHours: orgSettings.lowPrioritySlaHours,
          source: `ORGANIZATION_${organizationId}`,
        };
      }
    }

    // Tier 3: System defaults
    return {
      highPriorityHours: 24,
      lowPriorityHours: 48,
      source: 'SYSTEM_DEFAULT',
    };
  }

  /**
   * Generates Waste Aggregation Summary with CO2 Offset Metrics.
   */
  async getWasteSummary(query: WasteSummaryQueryDto) {
    const collections = await this.reportsRepository.getCollectionAggregates(query);

    let totalWeightKg = 0;
    let totalCo2OffsetKg = 0;
    const categoryMap = new Map<
      string,
      { categoryId: number; name: string; weightKg: number; co2OffsetKg: number; count: number }
    >();

    for (const c of collections) {
      totalWeightKg += c.weight;
      const catName = c.wasteCategory?.name || 'Uncategorized';
      const catId = c.wasteCategoryId;
      const co2Offset = this.calculateCo2Offset(c.weight, catName);
      totalCo2OffsetKg += co2Offset;

      if (!categoryMap.has(catName)) {
        categoryMap.set(catName, {
          categoryId: catId,
          name: catName,
          weightKg: 0,
          co2OffsetKg: 0,
          count: 0,
        });
      }

      const entry = categoryMap.get(catName)!;
      entry.weightKg = parseFloat((entry.weightKg + c.weight).toFixed(2));
      entry.co2OffsetKg = parseFloat((entry.co2OffsetKg + co2Offset).toFixed(2));
      entry.count += 1;
    }

    return {
      summary: {
        totalCollectionsCount: collections.length,
        totalWeightKg: parseFloat(totalWeightKg.toFixed(2)),
        totalCo2OffsetKg: parseFloat(totalCo2OffsetKg.toFixed(2)),
        equivalentTreesPlanted: Math.round(totalCo2OffsetKg / 20), // Approx 20kg CO2 per tree per year
      },
      categoryBreakdown: Array.from(categoryMap.values()),
    };
  }

  /**
   * Generates Complaint SLA Resolution & Breach Metrics using dynamic site/org threshold rules.
   */
  async getSlaMetrics(query: SlaQueryDto) {
    const complaints = await this.reportsRepository.getComplaintsAggregates(query);
    const slaRules = await this.resolveSlaThresholds(query.siteId, query.organizationId);

    let totalResolvedCount = 0;
    let totalResolutionHours = 0;
    let slaBreachesCount = 0;

    const statusCounts: Record<string, number> = {
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      REJECTED: 0,
    };

    for (const c of complaints) {
      statusCounts[c.status] = (statusCounts[c.status] || 0) + 1;

      if (c.resolvedAt) {
        totalResolvedCount++;
        const hours =
          (new Date(c.resolvedAt).getTime() - new Date(c.createdAt).getTime()) / (1000 * 60 * 60);
        totalResolutionHours += hours;

        // Dynamic SLA threshold: Site-level -> Org-level -> System Default
        const slaThresholdHours =
          c.priority === 'HIGH' || c.priority === 'CRITICAL'
            ? slaRules.highPriorityHours
            : slaRules.lowPriorityHours;

        if (hours > slaThresholdHours) {
          slaBreachesCount++;
        }
      }
    }

    const averageResolutionHours =
      totalResolvedCount > 0
        ? parseFloat((totalResolutionHours / totalResolvedCount).toFixed(1))
        : 0;

    return {
      totalComplaintsCount: complaints.length,
      statusCounts,
      appliedSlaRules: {
        highPriorityHours: slaRules.highPriorityHours,
        lowPriorityHours: slaRules.lowPriorityHours,
        ruleSource: slaRules.source,
      },
      slaMetrics: {
        resolvedComplaintsCount: totalResolvedCount,
        averageResolutionHours,
        slaBreachesCount,
        slaComplianceRate:
          totalResolvedCount > 0
            ? parseFloat(
                (((totalResolvedCount - slaBreachesCount) / totalResolvedCount) * 100).toFixed(1),
              )
            : 100,
      },
    };
  }

  /**
   * Generates Worker Performance Leaderboard.
   */
  async getWorkerLeaderboard(query: LeaderboardQueryDto) {
    const limit = query.limit || 10;
    const { collectionsGrouped, complaintsResolvedGrouped } =
      await this.reportsRepository.getWorkerPerformanceStats();

    const workerMap = new Map<
      number,
      {
        workerUserId: number;
        totalPickupsCount: number;
        totalWeightCollectedKg: number;
        complaintsResolvedCount: number;
      }
    >();

    for (const item of collectionsGrouped) {
      const workerId = item.collectorUserId;
      workerMap.set(workerId, {
        workerUserId: workerId,
        totalPickupsCount: item._count.id,
        totalWeightCollectedKg: parseFloat((item._sum.weight || 0).toFixed(2)),
        complaintsResolvedCount: 0,
      });
    }

    for (const item of complaintsResolvedGrouped) {
      const workerId = item.assignedEmployeeId!;
      if (!workerMap.has(workerId)) {
        workerMap.set(workerId, {
          workerUserId: workerId,
          totalPickupsCount: 0,
          totalWeightCollectedKg: 0,
          complaintsResolvedCount: item._count.id,
        });
      } else {
        workerMap.get(workerId)!.complaintsResolvedCount = item._count.id;
      }
    }

    const sortedWorkers = Array.from(workerMap.values())
      .sort(
        (a, b) =>
          b.totalPickupsCount +
          b.complaintsResolvedCount -
          (a.totalPickupsCount + a.complaintsResolvedCount),
      )
      .slice(0, limit);

    return { leaderboard: sortedWorkers };
  }
}
