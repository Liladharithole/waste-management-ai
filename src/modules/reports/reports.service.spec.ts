import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './repositories/reports.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

describe('ReportsService', () => {
  let service: ReportsService;
  let repository: any;

  const mockRepository = {
    getCollectionAggregates: jest.fn(),
    getComplaintsAggregates: jest.fn(),
    getWorkerPerformanceStats: jest.fn(),
  };

  const mockPrismaCore = {
    siteSettings: {
      findUnique: jest.fn(),
    },
    organizationSettings: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: ReportsRepository, useValue: mockRepository },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    repository = module.get<ReportsRepository>(ReportsRepository);

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

    it('REAL-WORLD EDGE CASE: should evaluate custom Site-level SLA settings when siteId is provided', async () => {
      // Site 1 has a strict 6-hour SLA for High priority complaints
      mockPrismaCore.siteSettings.findUnique.mockResolvedValue({
        siteId: 1,
        highPrioritySlaHours: 6,
        lowPrioritySlaHours: 12,
      });

      const createdAt = new Date('2026-08-01T10:00:00.000Z');
      const resolvedAt = new Date('2026-08-01T18:00:00.000Z'); // 8 hours later (Breaches 6h threshold!)

      const mockComplaints = [
        {
          id: 1,
          complaintNumber: 'CMP-02',
          status: ComplaintStatus.RESOLVED,
          priority: ComplaintPriority.HIGH,
          createdAt,
          resolvedAt,
          residentUserId: 25,
          assignedEmployeeId: 10,
        },
      ];
      mockRepository.getComplaintsAggregates.mockResolvedValue(mockComplaints);

      const result = await service.getSlaMetrics({ siteId: 1 });

      expect(result.appliedSlaRules.ruleSource).toBe('SITE_1');
      expect(result.appliedSlaRules.highPriorityHours).toBe(6);
      expect(result.slaMetrics.slaBreachesCount).toBe(1); // Flagged breach because 8h > 6h site rule!
    });
  });

  describe('getWorkerLeaderboard', () => {
    it('should calculate worker performance ranking', async () => {
      const collectionsGrouped = [
        { collectorUserId: 10, _count: { id: 15 }, _sum: { weight: 250.5 } },
      ];
      const complaintsResolvedGrouped = [{ assignedEmployeeId: 10, _count: { id: 5 } }];
      mockRepository.getWorkerPerformanceStats.mockResolvedValue({
        collectionsGrouped,
        complaintsResolvedGrouped,
      });

      const result = await service.getWorkerLeaderboard({ limit: 10 });

      expect(result.leaderboard).toHaveLength(1);
      expect(result.leaderboard[0]).toEqual({
        workerUserId: 10,
        totalPickupsCount: 15,
        totalWeightCollectedKg: 250.5,
        complaintsResolvedCount: 5,
      });
    });
  });
});
