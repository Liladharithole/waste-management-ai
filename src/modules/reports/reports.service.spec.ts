import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;

  const mockRepository = {
    getCollectionAggregates: jest.fn(),
    getComplaintsAggregates: jest.fn(),
    getWorkerPerformanceStats: jest.fn(),
    getInvoicesForAging: jest.fn(),
    getCompletedDispatchesWithLogs: jest.fn(),
    getDispatchesWithSchedules: jest.fn(),
  };

  const mockPrismaCore = {
    siteSettings: {
      findUnique: jest.fn(),
    },
    organizationSettings: {
      findUnique: jest.fn(),
    },
  };

  const mockPrismaMain = {
    wasteCollection: {
      findMany: jest.fn(),
    },
    wasteInvoice: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: mockRepository },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
        { provide: PrismaService, useValue: mockPrismaMain },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);

    jest.clearAllMocks();
  });

  describe('getWasteSummary', () => {
    it('should calculate total weight, category breakdown, and CO2 carbon offset', async () => {
      const mockCollections = [
        { id: 1, weight: 10, wasteCategoryId: 1, wasteCategory: { id: 1, name: 'Organic Waste' } },
        {
          id: 2,
          weight: 20,
          wasteCategoryId: 2,
          wasteCategory: { id: 2, name: 'Recyclable Plastic' },
        },
      ];
      mockRepository.getCollectionAggregates.mockResolvedValue(mockCollections);

      const result = await service.getWasteSummary({});

      expect(result.summary.totalCollectionsCount).toBe(2);
      expect(result.summary.totalWeightKg).toBe(30);
      expect(result.summary.totalCo2OffsetKg).toBe(29);
      expect(result.categoryBreakdown).toHaveLength(2);
    });
  });

  describe('getSlaMetrics (Dynamic Hierarchy)', () => {
    it('should evaluate default system SLA thresholds (24h/48h) when no custom settings exist', async () => {
      mockPrismaCore.siteSettings.findUnique.mockResolvedValue(null);
      mockPrismaCore.organizationSettings.findUnique.mockResolvedValue(null);

      const createdAt = new Date('2026-08-01T10:00:00.000Z');
      const resolvedAt = new Date('2026-08-01T15:00:00.000Z'); // 5 hours later

      const mockComplaints = [
        {
          id: 1,
          complaintNumber: 'CMP-01',
          status: ComplaintStatus.RESOLVED,
          priority: ComplaintPriority.MEDIUM,
          createdAt,
          resolvedAt,
          residentUserId: 25,
          assignedEmployeeId: 10,
        },
      ];
      mockRepository.getComplaintsAggregates.mockResolvedValue(mockComplaints);

      const result = await service.getSlaMetrics({});

      expect(result.totalComplaintsCount).toBe(1);
      expect(result.appliedSlaRules.ruleSource).toBe('SYSTEM_DEFAULT');
      expect(result.appliedSlaRules.highPriorityHours).toBe(24);
      expect(result.appliedSlaRules.lowPriorityHours).toBe(48);
      expect(result.slaMetrics.averageResolutionHours).toBe(5);
      expect(result.slaMetrics.slaBreachesCount).toBe(0);
    });
  });

  describe('getFinancialAgingReport', () => {
    it('should calculate financial revenue summary and aging buckets', async () => {
      mockRepository.getInvoicesForAging.mockResolvedValue([
        { id: 1, totalAmount: 100, status: 'PAID', dueDate: new Date('2026-08-01') },
        { id: 2, totalAmount: 50, status: 'ISSUED', dueDate: new Date('2026-08-05') },
      ]);

      const result = await service.getFinancialAgingReport();

      expect(result.totalInvoicesCount).toBe(2);
      expect(result.financialSummary.totalBilled).toBe(150);
      expect(result.financialSummary.totalCollected).toBe(100);
      expect(result.financialSummary.totalOverdueBalance).toBe(50);
    });
  });

  describe('getFuelEfficiencyReport', () => {
    it('should calculate total km driven and fuel cost per metric ton', async () => {
      mockRepository.getCompletedDispatchesWithLogs.mockResolvedValue([
        {
          id: 1,
          startOdometerKm: 45000,
          endOdometerKm: 45100,
          stopLogs: [{ collectedWeightKg: 500 }],
        },
      ]);

      const result = await service.getFuelEfficiencyReport();

      expect(result.completedShiftsCount).toBe(1);
      expect(result.metrics.totalKmDriven).toBe(100);
      expect(result.metrics.totalWasteCollectedTons).toBe(0.5);
    });
  });

  describe('getWasteSegregationReport', () => {
    it('should calculate waste segregation percentages and city grade', async () => {
      mockPrismaMain.wasteCollection.findMany.mockResolvedValue([
        { weight: 80, wasteCategory: { name: 'Organic Waste' } },
        { weight: 20, wasteCategory: { name: 'Recyclable Plastic' } },
      ]);

      const result = await service.getWasteSegregationReport();

      expect(result.totalCollectionsCount).toBe(2);
      expect(result.segregationBreakdown.organicPct).toBe(80);
      expect(result.overallCitySegregationGrade).toBe('GRADE_A (EXCELLENT)');
    });
  });

  describe('getRouteEfficiencyReport', () => {
    it('should calculate on-time completion rate for routes', async () => {
      mockRepository.getDispatchesWithSchedules.mockResolvedValue([
        { id: 1, status: 'COMPLETED', stopLogs: [] },
      ]);

      const result = await service.getRouteEfficiencyReport();

      expect(result.totalDispatches).toBe(1);
      expect(result.routeMetrics.onTimeRatePct).toBe(100);
    });
  });
});
