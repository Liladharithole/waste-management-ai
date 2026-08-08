import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ReportExportJobData } from './processors/reports-queue.processor';
import { BillingJobData } from './processors/billing-queue.processor';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('reports-queue') private readonly reportsQueue: Queue,
    @InjectQueue('billing-queue') private readonly billingQueue: Queue,
  ) {}

  /**
   * Adds a heavy report export job to BullMQ queue.
   */
  async addReportExportJob(data: ReportExportJobData) {
    const job = await this.reportsQueue.add('export-report', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },
      removeOnComplete: false,
    });

    return {
      message: 'Report export job queued successfully',
      jobId: job.id,
      status: 'QUEUED',
      reportType: data.reportType,
    };
  }

  /**
   * Adds a monthly billing generation job to BullMQ queue.
   */
  async addBillingJob(data: BillingJobData) {
    const job = await this.billingQueue.add('batch-billing', data, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: false,
    });

    return {
      message: 'Batch monthly billing job queued successfully',
      jobId: job.id,
      status: 'QUEUED',
      billingMonth: data.billingMonth,
    };
  }

  /**
   * Retrieves status, progress %, and output details of any BullMQ job.
   */
  async getJobStatus(jobId: string, queueName: 'reports-queue' | 'billing-queue') {
    const queue = queueName === 'reports-queue' ? this.reportsQueue : this.billingQueue;
    const job = await queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job #${jobId} not found in ${queueName}`);
    }

    const state = await job.getState();
    const progress = job.progress;
    const returnvalue = job.returnvalue;

    return {
      jobId: job.id,
      queueName,
      state,
      progress,
      result: returnvalue || null,
      failedReason: job.failedReason || null,
    };
  }
}
