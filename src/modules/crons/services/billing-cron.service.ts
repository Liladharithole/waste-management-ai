import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BillingService } from '../../billing/billing.service';
import { TariffsRepository } from '../../billing/repositories/tariffs.repository';
import { CronAuditService } from './cron-audit.service';
import { BillingFrequency, PayerType } from '@prisma/client';

@Injectable()
export class BillingCronService {
  private readonly logger = new Logger(BillingCronService.name);

  constructor(
    private readonly billingService: BillingService,
    private readonly tariffsRepository: TariffsRepository,
    private readonly cronAuditService: CronAuditService,
  ) {}

  /**
   * DAILY CRON: Runs every night at 1:00 AM (0 1 * * *).
   * Auto-generates DRAFT invoices for daily billing commercial sites & units.
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleDailyBillingCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Daily Billing Cron Job...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'BILLING_DAILY_CRON',
      triggeredBy,
    );
    const yesterdayStr = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    let generatedCount = 0;
    let errorCount = 0;

    try {
      const activeDailyTariffs = await this.tariffsRepository.findAll({
        page: 1,
        billingFrequency: BillingFrequency.DAILY,
        isActive: true,
        limit: 1000,
      });

      for (const tariff of activeDailyTariffs.data) {
        try {
          if (tariff.siteId) {
            await this.billingService.generateInvoiceDraft(
              {
                payerType: PayerType.SITE,
                siteId: tariff.siteId,
                billingMonth: yesterdayStr,
              },
              'CRON_DAILY_RUNNER',
            );
            generatedCount++;
          }
        } catch (err: any) {
          errorCount++;
          this.logger.error(
            `Failed to generate daily invoice for tariff ID ${tariff.id}: ${err.message}`,
          );
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, generatedCount, errorCount);
      this.logger.log(
        `✅ Daily Billing Cron completed. Total draft invoices generated: ${generatedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }

  /**
   * WEEKLY CRON: Runs every Monday at 2:00 AM (0 2 * * 1).
   * Auto-generates DRAFT invoices for weekly billing commercial sites & units.
   */
  @Cron('0 2 * * 1')
  async handleWeeklyBillingCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Weekly Billing Cron Job...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'BILLING_WEEKLY_CRON',
      triggeredBy,
    );
    const now = new Date();
    const weekStr = `${now.getFullYear()}-W${Math.ceil((now.getDate() + 6) / 7)}`;

    let generatedCount = 0;
    let errorCount = 0;

    try {
      const activeWeeklyTariffs = await this.tariffsRepository.findAll({
        page: 1,
        billingFrequency: BillingFrequency.WEEKLY,
        isActive: true,
        limit: 1000,
      });

      for (const tariff of activeWeeklyTariffs.data) {
        try {
          if (tariff.siteId) {
            await this.billingService.generateInvoiceDraft(
              {
                payerType: PayerType.SITE,
                siteId: tariff.siteId,
                billingMonth: weekStr,
              },
              'CRON_WEEKLY_RUNNER',
            );
            generatedCount++;
          }
        } catch (err: any) {
          errorCount++;
          this.logger.error(
            `Failed to generate weekly invoice for tariff ID ${tariff.id}: ${err.message}`,
          );
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, generatedCount, errorCount);
      this.logger.log(
        `✅ Weekly Billing Cron completed. Total draft invoices generated: ${generatedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }

  /**
   * MONTHLY CRON: Runs at 3:00 AM on the 1st of every month (0 3 1 * *).
   * Auto-generates DRAFT invoices for monthly residential housing societies & units.
   */
  @Cron('0 3 1 * *')
  async handleMonthlyBillingCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Monthly Billing Cron Job...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'BILLING_MONTHLY_CRON',
      triggeredBy,
    );
    const prevMonthDate = new Date();
    prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
    const monthStr = prevMonthDate.toISOString().slice(0, 7); // e.g. "2026-07"

    let generatedCount = 0;
    let errorCount = 0;

    try {
      const activeMonthlyTariffs = await this.tariffsRepository.findAll({
        page: 1,
        billingFrequency: BillingFrequency.MONTHLY,
        isActive: true,
        limit: 1000,
      });

      for (const tariff of activeMonthlyTariffs.data) {
        try {
          if (tariff.siteId) {
            await this.billingService.generateInvoiceDraft(
              {
                payerType: PayerType.SITE,
                siteId: tariff.siteId,
                billingMonth: monthStr,
              },
              'CRON_MONTHLY_RUNNER',
            );
            generatedCount++;
          } else if (tariff.organizationId) {
            await this.billingService.generateInvoiceDraft(
              {
                payerType: PayerType.ORGANIZATION,
                organizationId: tariff.organizationId,
                billingMonth: monthStr,
              },
              'CRON_MONTHLY_RUNNER',
            );
            generatedCount++;
          }
        } catch (err: any) {
          errorCount++;
          this.logger.error(
            `Failed to generate monthly invoice for tariff ID ${tariff.id}: ${err.message}`,
          );
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, generatedCount, errorCount);
      this.logger.log(
        `✅ Monthly Billing Cron completed. Total draft invoices generated: ${generatedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }
}
