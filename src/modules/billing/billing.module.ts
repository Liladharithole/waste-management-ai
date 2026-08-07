import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { TariffsController } from './tariffs.controller';
import { InvoicesController } from './invoices.controller';
import { TariffsRepository } from './repositories/tariffs.repository';
import { InvoicesRepository } from './repositories/invoices.repository';
import { WasteCategoriesModule } from '../waste-categories/waste-categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, WasteCategoriesModule],
  controllers: [TariffsController, InvoicesController],
  providers: [BillingService, TariffsRepository, InvoicesRepository],
  exports: [BillingService, TariffsRepository, InvoicesRepository],
})
export class BillingModule {}
