import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface ReportExportJobData {
  reportType: 'waste-collections' | 'invoices-ledger' | 'financial-aging';
  format: 'csv' | 'json';
  requestedByUserId: number;
}

@Processor('reports-queue')
export class ReportsQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsQueueProcessor.name);

  constructor(private readonly prismaMain: PrismaService) {
    super();
  }

  async process(job: Job<ReportExportJobData, any, string>): Promise<any> {
    this.logger.log(
      `Processing BullMQ Report Export Job #${job.id} - Type: ${job.data.reportType}`,
    );

    // Update job progress to 25%
    await job.updateProgress(25);

    let generatedContent = '';
    let recordCount = 0;

    if (job.data.reportType === 'waste-collections') {
      const collections = await this.prismaMain.wasteCollection.findMany({
        where: { deletedAt: null },
        include: { wasteCategory: true },
        take: 5000,
      });
      recordCount = collections.length;
      await job.updateProgress(60);

      const headers = 'ID,UUID,Collector User ID,Category,Weight (kg),Collection Date\n';
      const rows = collections.map((c) =>
        [
          c.id,
          c.uuid,
          c.collectorUserId,
          `"${c.wasteCategory?.name || 'Uncategorized'}"`,
          c.weight,
          `"${c.collectionDate.toISOString()}"`,
        ].join(','),
      );
      generatedContent = headers + rows.join('\n');
    } else if (job.data.reportType === 'invoices-ledger') {
      const invoices = await this.prismaMain.wasteInvoice.findMany({
        where: { deletedAt: null },
        take: 5000,
      });
      recordCount = invoices.length;
      await job.updateProgress(60);

      const headers = 'ID,Invoice Number,Billing Month,Total Amount,Status\n';
      const rows = invoices.map((i) =>
        [i.id, `"${i.invoiceNumber}"`, `"${i.billingMonth}"`, i.totalAmount, i.status].join(','),
      );
      generatedContent = headers + rows.join('\n');
    } else {
      const invoices = await this.prismaMain.wasteInvoice.findMany({
        where: { deletedAt: null },
      });
      recordCount = invoices.length;
      await job.updateProgress(60);

      let totalOverdue = 0;
      invoices.forEach((i) => {
        if (i.status === 'ISSUED' || i.status === 'OVERDUE') {
          totalOverdue += i.totalAmount;
        }
      });
      generatedContent = `Total Invoices,${invoices.length}\nTotal Overdue Balance,$${totalOverdue.toFixed(2)}\n`;
    }

    // Complete job at 100%
    await job.updateProgress(100);

    const mockDownloadUrl = `https://waste-management-exports.s3.amazonaws.com/reports/${job.data.reportType}_${job.id}.csv`;

    this.logger.log(
      `BullMQ Job #${job.id} completed successfully. Processed ${recordCount} records.`,
    );

    return {
      jobId: job.id,
      reportType: job.data.reportType,
      recordCount,
      downloadUrl: mockDownloadUrl,
      completedAt: new Date().toISOString(),
      contentSnippet: generatedContent.slice(0, 300),
    };
  }
}
