import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../prisma/prisma.service';
import { CronAuditService } from './cron-audit.service';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

@Injectable()
export class EscalationCronService {
  private readonly logger = new Logger(EscalationCronService.name);

  constructor(
    private readonly prismaMain: PrismaService,
    private readonly cronAuditService: CronAuditService,
  ) {}

  /**
   * MIDNIGHT COMPLAINT ESCALATION CRON: Runs every night at 00:00 AM (0 0 * * *).
   * Automatically scans unresolved complaints pending > 24h/48h and escalates priority.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleComplaintEscalationCron(triggeredBy: string = 'SYSTEM_TIMER') {
    this.logger.log('⏰ Starting Daily Complaint Escalation Scanner Cron...');
    const auditRecord = await this.cronAuditService.startAuditLog(
      'COMPLAINT_ESCALATION_CRON',
      triggeredBy,
    );
    const now = new Date();

    let processedCount = 0;
    let errorCount = 0;

    try {
      const openComplaints = await this.prismaMain.wasteComplaint.findMany({
        where: {
          deletedAt: null,
          status: {
            in: [ComplaintStatus.OPEN, ComplaintStatus.IN_PROGRESS],
          },
        },
      });

      for (const complaint of openComplaints) {
        try {
          const ageHours =
            (now.getTime() - new Date(complaint.createdAt).getTime()) / (1000 * 60 * 60);

          let newPriority: ComplaintPriority | null = null;

          if (ageHours >= 48 && complaint.priority !== ComplaintPriority.CRITICAL) {
            newPriority = ComplaintPriority.CRITICAL;
          } else if (
            ageHours >= 24 &&
            (complaint.priority === ComplaintPriority.LOW ||
              complaint.priority === ComplaintPriority.MEDIUM)
          ) {
            newPriority = ComplaintPriority.HIGH;
          }

          if (newPriority) {
            await this.prismaMain.wasteComplaint.update({
              where: { id: complaint.id },
              data: {
                priority: newPriority,
                updatedBy: 'CRON_ESCALATION_RUNNER',
              },
            });
            processedCount++;
          }
        } catch (err: any) {
          errorCount++;
          this.logger.error(`Failed to escalate complaint ID ${complaint.id}: ${err.message}`);
        }
      }

      await this.cronAuditService.completeAuditLog(auditRecord.id, processedCount, errorCount);
      this.logger.log(
        `✅ Complaint Escalation Cron completed. Total complaints escalated: ${processedCount}`,
      );
    } catch (fatalErr: any) {
      await this.cronAuditService.failAuditLog(auditRecord.id, fatalErr.stack || fatalErr.message);
      throw fatalErr;
    }
  }
}
