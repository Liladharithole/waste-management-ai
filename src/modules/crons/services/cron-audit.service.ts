import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { CronStatus } from '@prisma/client-central-core';

@Injectable()
export class CronAuditService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  async startAuditLog(cronName: string, triggeredBy: string = 'SYSTEM_TIMER') {
    return await this.prismaCore.cronJobLog.create({
      data: {
        cronName,
        status: CronStatus.RUNNING,
        triggeredBy,
        startedAt: new Date(),
      },
    });
  }

  async completeAuditLog(
    logId: number,
    itemsProcessedCount: number = 0,
    errorCount: number = 0,
    details?: string,
  ) {
    const log = await this.prismaCore.cronJobLog.findUnique({ where: { id: logId } });
    const now = new Date();
    const durationMs = log ? now.getTime() - new Date(log.startedAt).getTime() : 0;
    const finalStatus = errorCount > 0 ? CronStatus.PARTIAL_SUCCESS : CronStatus.SUCCESS;

    return await this.prismaCore.cronJobLog.update({
      where: { id: logId },
      data: {
        status: finalStatus,
        completedAt: now,
        executionDurationMs: durationMs,
        itemsProcessedCount,
        errorCount,
        details: details || `Processed ${itemsProcessedCount} items with ${errorCount} errors.`,
      },
    });
  }

  async failAuditLog(logId: number, errorStack: string, details?: string) {
    const log = await this.prismaCore.cronJobLog.findUnique({ where: { id: logId } });
    const now = new Date();
    const durationMs = log ? now.getTime() - new Date(log.startedAt).getTime() : 0;

    return await this.prismaCore.cronJobLog.update({
      where: { id: logId },
      data: {
        status: CronStatus.FAILED,
        completedAt: now,
        executionDurationMs: durationMs,
        errorCount: 1,
        errorLog: errorStack,
        details: details || 'Cron job failed with execution error.',
      },
    });
  }

  async findAllLogs(page = 1, limit = 10, cronName?: string, status?: CronStatus) {
    const skip = (page - 1) * limit;
    const whereClause: any = {
      ...(cronName ? { cronName } : {}),
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.cronJobLog.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { startedAt: 'desc' },
      }),
      this.prismaCore.cronJobLog.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async findLogById(id: number) {
    return await this.prismaCore.cronJobLog.findUnique({ where: { id } });
  }
}
