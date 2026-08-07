import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleQueryDto } from './dto/schedule-query.dto';
import { DailyChecklistQueryDto } from './dto/daily-checklist-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @RequirePermissions('schedules:view')
  @ApiOperation({ summary: 'Get all pickup schedules with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return paginated pickup schedules.' })
  async findAll(@Query() query: ScheduleQueryDto) {
    return this.schedulesService.findAll(query);
  }

  @Get('daily-checklist')
  @RequirePermissions('schedules:view')
  @ApiOperation({ summary: "Get driver's daily pickup route checklist for target date" })
  @ApiResponse({ status: 200, description: 'Return daily route checklist stops.' })
  async getDailyChecklist(@Query() query: DailyChecklistQueryDto) {
    return this.schedulesService.getDailyChecklist(query);
  }

  @Get(':id')
  @RequirePermissions('schedules:view')
  @ApiOperation({ summary: 'Get pickup schedule details by ID' })
  @ApiResponse({ status: 200, description: 'Return pickup schedule details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Schedule not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @RequirePermissions('schedules:create')
  @ApiOperation({ summary: 'Create a new pickup schedule' })
  @ApiResponse({ status: 201, description: 'Pickup schedule created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request: Start time must be before end time.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Site, building, employee, or category not found.',
  })
  async create(
    @Body() createDto: CreateScheduleDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.schedulesService.create(createDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('schedules:update')
  @ApiOperation({ summary: 'Update pickup schedule details or toggle active status' })
  @ApiResponse({ status: 200, description: 'Pickup schedule updated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Schedule, site, building, or employee not found.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateScheduleDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.schedulesService.update(id, updateDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('schedules:delete')
  @ApiOperation({ summary: 'Delete a pickup schedule (soft delete)' })
  @ApiResponse({ status: 200, description: 'Pickup schedule soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Schedule not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.schedulesService.delete(id, currentUser?.email);
  }
}
