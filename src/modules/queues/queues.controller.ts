import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { QueuesService } from './queues.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Async Job Queues (BullMQ)')
@ApiBearerAuth()
@Controller('queues')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class QueuesController {
  constructor(private readonly queuesService: QueuesService) {}

  @Post('report-exports')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Enqueue a heavy CSV/PDF report export job in BullMQ queue' })
  @ApiResponse({ status: 202, description: 'Job enqueued successfully. Returns jobId.' })
  async enqueueReportExport(
    @Body()
    body: {
      reportType: 'waste-collections' | 'invoices-ledger' | 'financial-aging';
      format?: 'csv' | 'json';
    },
    @CurrentUser() user: any,
  ) {
    return this.queuesService.addReportExportJob({
      reportType: body.reportType || 'waste-collections',
      format: body.format || 'csv',
      requestedByUserId: user.id,
    });
  }

  @Post('batch-billing')
  @RequirePermissions('billing:create')
  @ApiOperation({ summary: 'Enqueue a batch monthly billing calculation job in BullMQ queue' })
  @ApiResponse({ status: 202, description: 'Billing job enqueued successfully. Returns jobId.' })
  async enqueueBatchBilling(
    @Body() body: { billingMonth: string; siteId?: number; organizationId?: number },
    @CurrentUser() user: any,
  ) {
    return this.queuesService.addBillingJob({
      billingMonth: body.billingMonth,
      siteId: body.siteId,
      organizationId: body.organizationId,
      initiatedByUserId: user.id,
    });
  }

  @Get('jobs/:jobId')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Check status, progress %, and download URL of a queued BullMQ job' })
  @ApiResponse({ status: 200, description: 'Return job progress & result details.' })
  async getJobStatus(
    @Param('jobId') jobId: string,
    @Query('queueName') queueName?: 'reports-queue' | 'billing-queue',
  ) {
    return this.queuesService.getJobStatus(jobId, queueName || 'reports-queue');
  }
}
