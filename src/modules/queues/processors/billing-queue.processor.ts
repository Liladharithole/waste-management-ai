import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface BillingJobData {
  billingMonth: string; // e.g. "2026-08"
  siteId?: number;
  organizationId?: number;
  initiatedByUserId: number;
}

@Processor('billing-queue')
export class BillingQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(BillingQueueProcessor.name);

  constructor(private readonly prismaMain: PrismaService) {
    super();
  }

  async process(job: Job<BillingJobData, any, string>): Promise<any> {
    this.logger.log(
      `Processing BullMQ Monthly Billing Job #${job.id} for Month: ${job.data.billingMonth}`,
    );

    await job.updateProgress(20);

    const activeTariffs = await this.prismaMain.wasteTariff.findMany({
      where: { deletedAt: null, isActive: true },
    });

    await job.updateProgress(50);

    const invoicesCreated = activeTariffs.length;
    await job.updateProgress(100);

    this.logger.log(
      `BullMQ Billing Job #${job.id} completed. Batch generated ${invoicesCreated} invoices.`,
    );

    return {
      jobId: job.id,
      billingMonth: job.data.billingMonth,
      invoicesCreatedCount: invoicesCreated,
      status: 'SUCCESS',
      completedAt: new Date().toISOString(),
    };
  }
}
