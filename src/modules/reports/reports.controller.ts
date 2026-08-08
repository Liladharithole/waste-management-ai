import { Controller, Get, Header, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ReportsService } from './reports.service';
import { WasteSummaryQueryDto } from './dto/waste-summary-query.dto';
import { SlaQueryDto } from './dto/sla-query.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('waste-summary')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // Cache result in Redis for 5 minutes (300,000 ms)
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get total waste weight metrics and CO2 Carbon Offset analytics' })
  @ApiResponse({ status: 200, description: 'Return aggregated waste & CO2 offset summary.' })
  async getWasteSummary(@Query() query: WasteSummaryQueryDto) {
    return this.reportsService.getWasteSummary(query);
  }

  @Get('complaint-sla')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get complaint SLA resolution time and breach analytics' })
  @ApiResponse({ status: 200, description: 'Return SLA resolution metrics.' })
  async getSlaMetrics(@Query() query: SlaQueryDto) {
    return this.reportsService.getSlaMetrics(query);
  }

  @Get('worker-leaderboard')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get worker performance leaderboard (pickups & complaint fixes)' })
  @ApiResponse({ status: 200, description: 'Return worker performance ranking.' })
  async getWorkerLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.reportsService.getWorkerLeaderboard(query);
  }

  @Get('financial-aging')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({
    summary: 'Get Financial Revenue & Invoice Aging Report (30/60/90+ days overdue)',
  })
  @ApiResponse({ status: 200, description: 'Return financial revenue & aging metrics.' })
  async getFinancialAgingReport() {
    return this.reportsService.getFinancialAgingReport();
  }

  @Get('fuel-efficiency')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({
    summary: 'Get Fleet Fuel Efficiency & Mileage Cost Report (km/L and fuel cost/ton)',
  })
  @ApiResponse({ status: 200, description: 'Return fuel efficiency & mileage cost metrics.' })
  async getFuelEfficiencyReport() {
    return this.reportsService.getFuelEfficiencyReport();
  }

  @Get('waste-segregation')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({
    summary: 'Get Waste Segregation Quality & Contamination Report (% Organic vs Recyclable)',
  })
  @ApiResponse({ status: 200, description: 'Return waste segregation quality metrics.' })
  async getWasteSegregationReport() {
    return this.reportsService.getWasteSegregationReport();
  }

  @Get('route-efficiency')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get Route On-Time Arrival & Schedule Delay Report' })
  @ApiResponse({ status: 200, description: 'Return route timing & delay metrics.' })
  async getRouteEfficiencyReport() {
    return this.reportsService.getRouteEfficiencyReport();
  }

  @Get('export/waste-collections.csv')
  @RequirePermissions('reports:view')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="waste-collections.csv"')
  @ApiOperation({ summary: 'Export waste collection records in CSV format' })
  async exportWasteCollectionsCsv() {
    return this.reportsService.exportWasteCollectionsCsv();
  }

  @Get('export/invoices.csv')
  @RequirePermissions('reports:view')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="invoices-ledger.csv"')
  @ApiOperation({ summary: 'Export invoices ledger records in CSV format' })
  async exportInvoicesCsv() {
    return this.reportsService.exportInvoicesCsv();
  }
}
