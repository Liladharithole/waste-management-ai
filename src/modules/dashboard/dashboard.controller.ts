import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Dashboard & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard:view')
  @ApiOperation({
    summary:
      'Get executive KPI cards & operational analytics (Waste Tonnage, Fleet Compliance, Billing Financials)',
  })
  @ApiResponse({ status: 200, description: 'Executive dashboard analytics loaded.' })
  async getSummary(@Query() query: DashboardQueryDto) {
    return await this.dashboardService.getExecutiveSummary(query);
  }
}
