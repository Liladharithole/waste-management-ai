import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './repositories/dashboard.repository';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly dashboardRepo: DashboardRepository) {}

  async getExecutiveSummary(query: DashboardQueryDto) {
    const [wasteStats, fleetStats, billingStats] = await Promise.all([
      this.dashboardRepo.getWasteCollectionStats(query),
      this.dashboardRepo.getFleetComplianceStats(query.organizationId),
      this.dashboardRepo.getBillingFinancialStats(query.organizationId),
    ]);

    return {
      wasteCollection: wasteStats,
      fleetCompliance: fleetStats,
      financials: billingStats,
      generatedAt: new Date().toISOString(),
    };
  }
}
