import { Module } from '@nestjs/common';
import { BillingCronService } from './services/billing-cron.service';
import { OverdueInvoicesCronService } from './services/overdue-invoices-cron.service';
import { CronAuditService } from './services/cron-audit.service';
import { CronsController } from './crons.controller';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [CronsController],
  providers: [BillingCronService, OverdueInvoicesCronService, CronAuditService],
  exports: [BillingCronService, OverdueInvoicesCronService, CronAuditService],
})
export class CronsModule {}
