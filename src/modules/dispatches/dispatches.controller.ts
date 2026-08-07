import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DispatchesService } from './dispatches.service';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { UpdateDispatchStatusDto } from './dto/update-dispatch-status.dto';
import { CreateStopLogDto } from './dto/create-stop-log.dto';
import { DispatchQueryDto } from './dto/dispatch-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Dispatches & Shifts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('dispatches')
export class DispatchesController {
  constructor(private readonly dispatchesService: DispatchesService) {}

  @Post()
  @RequirePermissions('dispatches:create')
  @ApiOperation({
    summary: 'Schedule a daily shift dispatch (Driver + Helper + Vehicle + Route Schedule)',
  })
  @ApiResponse({ status: 201, description: 'Dispatch shift scheduled successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Non-compliant vehicle/driver or vehicle in maintenance.',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Driver or vehicle already assigned to an active shift on date.',
  })
  async create(@Body() dto: CreateDispatchDto, @CurrentUser('email') email: string) {
    return await this.dispatchesService.createDispatch(dto, email);
  }

  @Get()
  @RequirePermissions('dispatches:view')
  @ApiOperation({ summary: 'Get paginated list of shift dispatches' })
  async findAll(@Query() query: DispatchQueryDto) {
    return await this.dispatchesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('dispatches:view')
  @ApiOperation({
    summary: 'Get shift dispatch details by ID including stop logs and distance (km)',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.dispatchesService.findOne(id);
  }

  @Patch(':id/status')
  @RequirePermissions('dispatches:update')
  @ApiOperation({ summary: 'Update shift status (STARTED, COMPLETED) & record odometer km' })
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDispatchStatusDto,
    @CurrentUser('email') email: string,
  ) {
    return await this.dispatchesService.updateStatus(id, dto, email);
  }

  @Post(':id/stops')
  @RequirePermissions('dispatches:update')
  @ApiOperation({
    summary:
      'Driver logs a route stop checkpoint (Arrival time, GPS coordinates, Collected weight kg)',
  })
  async recordStop(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateStopLogDto,
    @CurrentUser('email') email: string,
  ) {
    return await this.dispatchesService.recordStop(id, dto, email);
  }
}
