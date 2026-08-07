import { Test, TestingModule } from '@nestjs/testing';
import { CronsController } from './crons.controller';
import { BillingCronService } from './services/billing-cron.service';
import { OverdueInvoicesCronService } from './services/overdue-invoices-cron.service';
import { ComplianceCronService } from './services/compliance-cron.service';
import { EscalationCronService } from './services/escalation-cron.service';
import { CronAuditService } from './services/cron-audit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CronSecretGuard } from './guards/cron-secret.guard';

describe('CronsController', () => {
  let controller: CronsController;

  const mockBillingCronService = {
    handleDailyBillingCron: jest.fn(),
    handleWeeklyBillingCron: jest.fn(),
    handleMonthlyBillingCron: jest.fn(),
  };

  const mockOverdueCronService = {
    handleOverdueInvoicesCron: jest.fn(),
  };

  const mockComplianceCronService = {
    handleComplianceExpiryCron: jest.fn(),
  };

  const mockEscalationCronService = {
    handleComplaintEscalationCron: jest.fn(),
  };

  const mockCronAuditService = {
    findAllLogs: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findLogById: jest.fn().mockResolvedValue({ id: 1 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CronsController],
      providers: [
        { provide: BillingCronService, useValue: mockBillingCronService },
        { provide: OverdueInvoicesCronService, useValue: mockOverdueCronService },
        { provide: ComplianceCronService, useValue: mockComplianceCronService },
        { provide: EscalationCronService, useValue: mockEscalationCronService },
        { provide: CronAuditService, useValue: mockCronAuditService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CronSecretGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CronsController>(CronsController);

    jest.clearAllMocks();
  });

  describe('triggerDailyBilling', () => {
    it('should invoke handleDailyBillingCron and return success object', async () => {
      const result = await controller.triggerDailyBilling();

      expect(result.success).toBe(true);
      expect(mockBillingCronService.handleDailyBillingCron).toHaveBeenCalledWith('HTTP_WEBHOOK');
    });
  });

  describe('triggerComplaintEscalation', () => {
    it('should invoke handleComplaintEscalationCron and return success object', async () => {
      const result = await controller.triggerComplaintEscalation();

      expect(result.success).toBe(true);
      expect(mockEscalationCronService.handleComplaintEscalationCron).toHaveBeenCalledWith(
        'HTTP_WEBHOOK',
      );
    });
  });
});
