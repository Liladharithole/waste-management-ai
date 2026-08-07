import { Test, TestingModule } from '@nestjs/testing';
import { BillingCronService } from './billing-cron.service';
import { BillingService } from '../../billing/billing.service';
import { TariffsRepository } from '../../billing/repositories/tariffs.repository';
import { CronAuditService } from './cron-audit.service';
import { BillingFrequency } from '@prisma/client';

describe('BillingCronService', () => {
  let cronService: BillingCronService;

  const mockBillingService = {
    generateInvoiceDraft: jest.fn(),
  };

  const mockTariffsRepo = {
    findAll: jest.fn(),
  };

  const mockCronAuditService = {
    startAuditLog: jest.fn().mockResolvedValue({ id: 1 }),
    completeAuditLog: jest.fn().mockResolvedValue({ id: 1 }),
    failAuditLog: jest.fn().mockResolvedValue({ id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingCronService,
        { provide: BillingService, useValue: mockBillingService },
        { provide: TariffsRepository, useValue: mockTariffsRepo },
        { provide: CronAuditService, useValue: mockCronAuditService },
      ],
    }).compile();

    cronService = module.get<BillingCronService>(BillingCronService);

    jest.clearAllMocks();
  });

  describe('handleDailyBillingCron', () => {
    it('should trigger invoice draft generation for all active daily tariffs', async () => {
      mockTariffsRepo.findAll.mockResolvedValue({
        data: [{ id: 1, siteId: 10, billingFrequency: BillingFrequency.DAILY }],
      });
      mockBillingService.generateInvoiceDraft.mockResolvedValue({ id: 100 });

      await cronService.handleDailyBillingCron();

      expect(mockTariffsRepo.findAll).toHaveBeenCalledWith({
        page: 1,
        billingFrequency: BillingFrequency.DAILY,
        isActive: true,
        limit: 1000,
      });
      expect(mockBillingService.generateInvoiceDraft).toHaveBeenCalledWith(
        expect.objectContaining({ siteId: 10 }),
        'CRON_DAILY_RUNNER',
      );
      expect(mockCronAuditService.completeAuditLog).toHaveBeenCalled();
    });
  });
});
