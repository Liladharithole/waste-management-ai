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
import { FloorsService } from './floors.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Floors')
@ApiBearerAuth()
@Controller('floors')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FloorsController {
  constructor(private readonly floorsService: FloorsService) {}

  @Get()
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get all active floors' })
  @ApiResponse({ status: 200, description: 'Return all floors.' })
  async findAll(@Query('buildingId') buildingId?: string) {
    const parsedBuildingId = buildingId ? parseInt(buildingId, 10) : undefined;
    return this.floorsService.findAll(parsedBuildingId);
  }

  @Get(':id')
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get floor by ID' })
  @ApiResponse({ status: 200, description: 'Return floor details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Floor not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.floorsService.findOne(id);
  }

  @Post()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Create a new floor' })
  @ApiResponse({ status: 201, description: 'Floor successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Parent Building not found.' })
  async create(@Body() createFloorDto: CreateFloorDto) {
    return this.floorsService.create(createFloorDto);
  }

  @Patch(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Update floor details' })
  @ApiResponse({ status: 200, description: 'Floor updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Floor not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateFloorDto: UpdateFloorDto) {
    return this.floorsService.update(id, updateFloorDto);
  }

  @Delete(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Delete a floor' })
  @ApiResponse({ status: 200, description: 'Floor successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Floor not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Floor contains active flat dependencies.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.floorsService.delete(id);
  }
}
