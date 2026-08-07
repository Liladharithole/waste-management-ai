import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get total waste weight metrics and CO2 Carbon Offset analytics' })
  @ApiResponse({ status: 200, description: 'Return aggregated waste & CO2 offset summary.' })
  async getWasteSummary(@Query() query: WasteSummaryQueryDto) {
    return this.reportsService.getWasteSummary(query);
  }

  @Get('complaint-sla')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get complaint SLA resolution time and breach analytics' })
  @ApiResponse({ status: 200, description: 'Return SLA resolution metrics.' })
  async getSlaMetrics(@Query() query: SlaQueryDto) {
    return this.reportsService.getSlaMetrics(query);
  }

  @Get('worker-leaderboard')
  @RequirePermissions('reports:view')
  @ApiOperation({ summary: 'Get worker performance leaderboard (pickups & complaint fixes)' })
  @ApiResponse({ status: 200, description: 'Return worker performance ranking.' })
  async getWorkerLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.reportsService.getWorkerLeaderboard(query);
  }
}
