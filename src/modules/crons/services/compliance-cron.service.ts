import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { CronAuditService } from './cron-audit.service';
import {
  ComplianceDocStatus,
  ComplianceEntityType,
  ComplianceStatus,
} from '@prisma/client-central-core';

@Injectable()
export class ComplianceCronService {
  private readonly logger = new Logger(ComplianceCronService.name);

  constructor(
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly prismaMain: PrismaService,
    private readonly cronAuditService: CronAuditService,
  ) {}

  /**
   * MIDNIGHT COMPLIANCE CRON: Runs every night at 00:00 AM (0 0 * * *).
   * Automatically scans expired compliance documents and flips target Vehicle/Employee to NON_COMPLIANT.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleComplianceExpiryCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Daily Compliance Expiry Check Cron...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'COMPLIANCE_EXPIRY_CRON',
      triggeredBy,
    );
    const now = new Date();

    let processedCount = 0;
    let errorCount = 0;

    try {
      const expiredDocs = await this.prismaCore.complianceDocument.findMany({
        where: {
          deletedAt: null,
          status: ComplianceDocStatus.VALID,
          expiryDate: {
            lt: now,
          },
        },
      });

      for (const doc of expiredDocs) {
        try {
          // 1. Mark Document as EXPIRED
          await this.prismaCore.complianceDocument.update({
            where: { id: doc.id },
            data: { status: ComplianceDocStatus.EXPIRED, updatedBy: 'CRON_COMPLIANCE_RUNNER' },
          });

          // 2. Flip target Entity complianceStatus to NON_COMPLIANT
          if (doc.entityType === ComplianceEntityType.VEHICLE) {
            await this.prismaMain.wasteVehicle.update({
              where: { id: doc.entityId },
              data: {
                complianceStatus: ComplianceStatus.NON_COMPLIANT as any,
                updatedBy: 'CRON_COMPLIANCE_RUNNER',
              },
            });
          } else if (doc.entityType === ComplianceEntityType.EMPLOYEE) {
            await this.prismaCore.employee.update({
              where: { id: doc.entityId },
              data: {
                complianceStatus: ComplianceStatus.NON_COMPLIANT,
                updatedBy: 'CRON_COMPLIANCE_RUNNER',
              },
            });
          }

          processedCount++;
        } catch (err: any) {
          errorCount++;
          this.logger.error(
            `Failed to process compliance expiry for doc ID ${doc.id}: ${err.message}`,
          );
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, processedCount, errorCount);
      this.logger.log(
        `✅ Compliance Expiry Cron completed. Total expired documents processed: ${processedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }
}
