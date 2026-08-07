import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DriverAppService } from './driver-app.service';
import { StartShiftDto } from './dto/start-shift.dto';
import { StopCheckpointDto } from './dto/stop-checkpoint.dto';
import { CompleteShiftDto } from './dto/complete-shift.dto';
import { ReportBreakdownDto } from './dto/report-breakdown.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Driver Mobile App API')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('driver-app')
export class DriverAppController {
  constructor(private readonly driverAppService: DriverAppService) {}

  @Get('my-today-shifts')
  @RequirePermissions('dispatches:view')
  @ApiOperation({ summary: "Get today's assigned shift schedules for authenticated driver" })
  async getTodayShifts(@Request() req: any) {
    const userId = req.user.sub;
    return this.driverAppService.getTodayShifts(userId);
  }

  @Get('my-profile')
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'Get driver profile, commercial license status & compliance badge' })
  async getDriverProfile(@Request() req: any) {
    const userId = req.user.sub;
    return this.driverAppService.getDriverProfile(userId);
  }

  @Get('history-summary')
  @RequirePermissions('dispatches:view')
  @ApiOperation({ summary: 'Get driver completed shift history & total performance metrics' })
  async getShiftHistorySummary(@Request() req: any) {
    const userId = req.user.sub;
    return this.driverAppService.getShiftHistorySummary(userId);
  }

  @Post('shifts/:dispatchId/start')
  @RequirePermissions('dispatches:update')
  @ApiOperation({ summary: 'Start a shift dispatch and record starting odometer reading' })
  async startShift(
    @Param('dispatchId', ParseIntPipe) dispatchId: number,
    @Body() dto: StartShiftDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.driverAppService.startShift(dispatchId, userId, dto);
  }

  @Post('shifts/:dispatchId/stop-checkpoint')
  @RequirePermissions('dispatches:update')
  @ApiOperation({ summary: 'Log a route stop checkpoint (GPS, collected weight, photo proof)' })
  async recordStopCheckpoint(
    @Param('dispatchId', ParseIntPipe) dispatchId: number,
    @Body() dto: StopCheckpointDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.driverAppService.recordStopCheckpoint(dispatchId, userId, dto);
  }

  @Post('shifts/:dispatchId/complete')
  @RequirePermissions('dispatches:update')
  @ApiOperation({ summary: 'Complete a shift dispatch and record ending odometer reading' })
  async completeShift(
    @Param('dispatchId', ParseIntPipe) dispatchId: number,
    @Body() dto: CompleteShiftDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub;
    return this.driverAppService.completeShift(dispatchId, userId, dto);
  }

  @Post('emergency-breakdown')
  @RequirePermissions('dispatches:update')
  @ApiOperation({
    summary: 'Report emergency truck breakdown (flat tire, accident, engine failure)',
  })
  async reportEmergencyBreakdown(@Body() dto: ReportBreakdownDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.driverAppService.reportEmergencyBreakdown(userId, dto);
  }
}
