import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillingCronService } from './services/billing-cron.service';
import { OverdueInvoicesCronService } from './services/overdue-invoices-cron.service';
import { ComplianceCronService } from './services/compliance-cron.service';
import { EscalationCronService } from './services/escalation-cron.service';
import { CronAuditService } from './services/cron-audit.service';
import { CronSecretGuard } from './guards/cron-secret.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CronStatus } from '@prisma/client-central-core';

@ApiTags('Crons')
@Controller('crons')
export class CronsController {
  constructor(
    private readonly billingCronService: BillingCronService,
    private readonly overdueInvoicesCronService: OverdueInvoicesCronService,
    private readonly complianceCronService: ComplianceCronService,
    private readonly escalationCronService: EscalationCronService,
    private readonly cronAuditService: CronAuditService,
  ) {}

  @Post('trigger/daily-billing')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger daily billing cron job' })
  @ApiResponse({ status: 200, description: 'Daily billing cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerDailyBilling() {
    await this.billingCronService.handleDailyBillingCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Daily billing cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/weekly-billing')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger weekly billing cron job' })
  @ApiResponse({ status: 200, description: 'Weekly billing cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerWeeklyBilling() {
    await this.billingCronService.handleWeeklyBillingCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Weekly billing cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/monthly-billing')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger monthly billing cron job' })
  @ApiResponse({ status: 200, description: 'Monthly billing cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerMonthlyBilling() {
    await this.billingCronService.handleMonthlyBillingCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Monthly billing cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/overdue-invoices')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger overdue invoices auto-updater cron job' })
  @ApiResponse({ status: 200, description: 'Overdue invoices cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerOverdueInvoices() {
    await this.overdueInvoicesCronService.handleOverdueInvoicesCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Overdue invoices cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/compliance-check')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger compliance expiry check cron job' })
  @ApiResponse({ status: 200, description: 'Compliance check cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerComplianceCheck() {
    await this.complianceCronService.handleComplianceExpiryCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Compliance check cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Post('trigger/complaint-escalation')
  @UseGuards(CronSecretGuard)
  @ApiHeader({
    name: 'X-CRON-SECRET',
    description: 'Secret API key for cron execution',
    required: true,
  })
  @ApiOperation({ summary: 'Manually trigger complaint priority escalation cron job' })
  @ApiResponse({ status: 200, description: 'Complaint escalation cron executed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid X-CRON-SECRET header.' })
  async triggerComplaintEscalation() {
    await this.escalationCronService.handleComplaintEscalationCron('HTTP_WEBHOOK');
    return {
      success: true,
      message: 'Complaint escalation cron executed successfully.',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('dashboard:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated audit logs of past cron executions' })
  async getLogs(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('cronName') cronName?: string,
    @Query('status') status?: CronStatus,
  ) {
    return await this.cronAuditService.findAllLogs(Number(page), Number(limit), cronName, status);
  }

  @Get('logs/:id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('dashboard:view')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed cron execution log by ID' })
  async getLogById(@Param('id', ParseIntPipe) id: number) {
    return await this.cronAuditService.findLogById(id);
  }
}
