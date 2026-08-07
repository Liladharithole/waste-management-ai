import { Module } from '@nestjs/common';
import { BillingCronService } from './services/billing-cron.service';
import { OverdueInvoicesCronService } from './services/overdue-invoices-cron.service';
import { ComplianceCronService } from './services/compliance-cron.service';
import { EscalationCronService } from './services/escalation-cron.service';
import { CronAuditService } from './services/cron-audit.service';
import { CronsController } from './crons.controller';
import { BillingModule } from '../billing/billing.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [BillingModule, PrismaModule, PrismaCentralCoreModule],
  controllers: [CronsController],
  providers: [
    BillingCronService,
    OverdueInvoicesCronService,
    ComplianceCronService,
    EscalationCronService,
    CronAuditService,
  ],
  exports: [
    BillingCronService,
    OverdueInvoicesCronService,
    ComplianceCronService,
    EscalationCronService,
    CronAuditService,
  ],
})
export class CronsModule {}
