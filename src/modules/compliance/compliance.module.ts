import { Module } from '@nestjs/common';
import { ComplianceService } from './compliance.service';
import { ComplianceController } from './compliance.controller';
import { ComplianceDocumentsRepository } from './repositories/compliance-documents.repository';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaCentralCoreModule],
  controllers: [ComplianceController],
  providers: [ComplianceService, ComplianceDocumentsRepository],
  exports: [ComplianceService, ComplianceDocumentsRepository],
})
export class ComplianceModule {}
