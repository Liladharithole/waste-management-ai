import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GisService } from './gis.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('GIS & Live Fleet Map')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('gis')
export class GisController {
  constructor(private readonly gisService: GisService) {}

  @Get('active-fleet-map')
  @RequirePermissions('schedules:view')
  @ApiOperation({
    summary:
      'Get live GIS map stream of active fleet vehicles, GPS positions, driver names, and route progress',
  })
  @ApiResponse({ status: 200, description: 'Active GIS fleet map data loaded.' })
  async getActiveFleetMap(@Query('organizationId') organizationId?: number) {
    return await this.gisService.getActiveFleetLiveMap(
      organizationId ? Number(organizationId) : undefined,
    );
  }

  @Get('shift-route-progress/:dispatchId')
  @RequirePermissions('schedules:view')
  @ApiOperation({
    summary:
      'Get detailed GIS route progress, checkpoints, and collected waste metrics for a shift dispatch',
  })
  async getRouteProgress(@Param('dispatchId', ParseIntPipe) dispatchId: number) {
    return await this.gisService.getDispatchRouteProgress(dispatchId);
  }

  @Get('journey-replay/:dispatchId')
  @RequirePermissions('schedules:view')
  @ApiOperation({
    summary:
      'Get complete historical GPS breadcrumbs array for route replay animation on Google Maps',
  })
  async getJourneyRouteReplay(@Param('dispatchId', ParseIntPipe) dispatchId: number) {
    return await this.gisService.getJourneyRouteReplay(dispatchId);
  }

  @Get('journey-timeline/:dispatchId')
  @RequirePermissions('schedules:view')
  @ApiOperation({
    summary:
      'Get enriched shift journey events timeline (Shift start, pickups, skipped stops, speeding & breakdown alerts, shift complete)',
  })
  async getJourneyTimeline(@Param('dispatchId', ParseIntPipe) dispatchId: number) {
    return await this.gisService.getJourneyTimeline(dispatchId);
  }
}
