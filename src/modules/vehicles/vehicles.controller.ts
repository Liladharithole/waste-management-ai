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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Fleet Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @RequirePermissions('vehicles:create')
  @ApiOperation({ summary: 'Register a new fleet waste collection vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle registered successfully.' })
  async create(@Body() dto: CreateVehicleDto, @CurrentUser('email') email: string) {
    return await this.vehiclesService.createVehicle(dto, email);
  }

  @Get()
  @RequirePermissions('vehicles:view')
  @ApiOperation({
    summary: 'Get paginated list of fleet vehicles with status & compliance filters',
  })
  async findAll(@Query() query: VehicleQueryDto) {
    return await this.vehiclesService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('vehicles:view')
  @ApiOperation({
    summary: 'Get fleet vehicle details by ID including active compliance documents',
  })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.vehiclesService.findOne(id);
  }

  @Patch(':id')
  @RequirePermissions('vehicles:update')
  @ApiOperation({ summary: 'Update fleet vehicle details or status' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser('email') email: string,
  ) {
    return await this.vehiclesService.updateVehicle(id, dto, email);
  }

  @Delete(':id')
  @RequirePermissions('vehicles:delete')
  @ApiOperation({ summary: 'Soft-delete fleet vehicle' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('email') email: string) {
    return await this.vehiclesService.removeVehicle(id, email);
  }
}
