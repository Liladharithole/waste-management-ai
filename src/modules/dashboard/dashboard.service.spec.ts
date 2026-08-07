import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { DashboardRepository } from './repositories/dashboard.repository';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockRepo = {
    getWasteCollectionStats: jest.fn(),
    getFleetComplianceStats: jest.fn(),
    getBillingFinancialStats: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DashboardService, { provide: DashboardRepository, useValue: mockRepo }],
    }).compile();

    service = module.get<DashboardService>(DashboardService);

    jest.clearAllMocks();
  });

  describe('getExecutiveSummary', () => {
    it('should aggregate waste stats, fleet stats, and billing stats', async () => {
      mockRepo.getWasteCollectionStats.mockResolvedValue({
        totalCollections: 50,
        totalWeightMetricTons: 12.5,
      });
      mockRepo.getFleetComplianceStats.mockResolvedValue({
        vehicles: { complianceRatePercentage: 100 },
      });
      mockRepo.getBillingFinancialStats.mockResolvedValue({
        summary: { totalInvoicedAmount: 50000 },
      });

      const result = await service.getExecutiveSummary({});
      expect(result.wasteCollection.totalCollections).toBe(50);
      expect(result.fleetCompliance.vehicles.complianceRatePercentage).toBe(100);
      expect(result.financials.summary.totalInvoicedAmount).toBe(50000);
    });
  });
});
