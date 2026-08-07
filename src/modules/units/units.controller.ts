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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Units')
@ApiBearerAuth()
@Controller('units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @RequirePermissions('units:view')
  @ApiOperation({ summary: 'Get all active units with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated units.' })
  async findAll(@Query() paginationDto: PaginationQueryDto, @Query('floorId') floorId?: string) {
    const parsedFloorId = floorId ? parseInt(floorId, 10) : undefined;
    return this.unitsService.findAll(paginationDto, parsedFloorId);
  }

  @Get(':id')
  @RequirePermissions('units:view')
  @ApiOperation({ summary: 'Get unit by ID' })
  @ApiResponse({ status: 200, description: 'Return unit details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Unit not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.findOne(id);
  }

  @Post()
  @RequirePermissions('units:create')
  @ApiOperation({ summary: 'Create a new unit' })
  @ApiResponse({ status: 201, description: 'Unit successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Parent Floor not found.' })
  async create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  @Patch(':id')
  @RequirePermissions('units:update')
  @ApiOperation({ summary: 'Update unit details' })
  @ApiResponse({ status: 200, description: 'Unit updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Unit not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Delete(':id')
  @RequirePermissions('units:delete')
  @ApiOperation({ summary: 'Delete a unit' })
  @ApiResponse({ status: 200, description: 'Unit successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Unit not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Unit has assigned active residents.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.unitsService.delete(id);
  }
}
