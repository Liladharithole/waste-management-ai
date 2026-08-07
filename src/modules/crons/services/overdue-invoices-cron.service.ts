import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InvoicesRepository } from '../../billing/repositories/invoices.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { CronAuditService } from './cron-audit.service';
import { InvoiceStatus } from '@prisma/client';

@Injectable()
export class OverdueInvoicesCronService {
  private readonly logger = new Logger(OverdueInvoicesCronService.name);

  constructor(
    private readonly invoicesRepository: InvoicesRepository,
    private readonly prisma: PrismaService,
    private readonly cronAuditService: CronAuditService,
  ) {}

  /**
   * MIDNIGHT CRON: Runs every night at 00:00 AM (0 0 * * *).
   * Automatically scans ISSUED invoices whose dueDate has passed and marks them OVERDUE.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleOverdueInvoicesCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Overdue Invoices Auto-Updater Cron...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'OVERDUE_INVOICES_CRON',
      triggeredBy,
    );
    const now = new Date();

    let updatedCount = 0;
    let errorCount = 0;

    try {
      const expiredInvoices = await this.prisma.wasteInvoice.findMany({
        where: {
          deletedAt: null,
          status: InvoiceStatus.ISSUED,
          dueDate: {
            lt: now,
          },
        },
      });

      for (const inv of expiredInvoices) {
        try {
          await this.invoicesRepository.updateStatus(inv.id, InvoiceStatus.OVERDUE, {
            updatedBy: 'CRON_OVERDUE_RUNNER',
          });
          updatedCount++;
        } catch (err: any) {
          errorCount++;
          this.logger.error(`Failed to mark invoice ID ${inv.id} as OVERDUE: ${err.message}`);
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, updatedCount, errorCount);
      this.logger.log(
        `✅ Overdue Invoices Cron completed. Total invoices updated to OVERDUE: ${updatedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }
}
