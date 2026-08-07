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
import { BuildingsService } from './buildings.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Buildings')
@ApiBearerAuth()
@Controller('buildings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BuildingsController {
  constructor(private readonly buildingsService: BuildingsService) {}

  @Get()
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get all active buildings with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated buildings.' })
  async findAll(@Query() paginationDto: PaginationQueryDto, @Query('siteId') siteId?: string) {
    const parsedSiteId = siteId ? parseInt(siteId, 10) : undefined;
    return this.buildingsService.findAll(paginationDto, parsedSiteId);
  }

  @Get(':id')
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiResponse({ status: 200, description: 'Return building details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Building not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.findOne(id);
  }

  @Post()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Create a new building' })
  @ApiResponse({ status: 201, description: 'Building successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Parent Site not found.' })
  async create(@Body() createBuildingDto: CreateBuildingDto) {
    return this.buildingsService.create(createBuildingDto);
  }

  @Patch(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Update building details' })
  @ApiResponse({ status: 200, description: 'Building updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Building not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBuildingDto: UpdateBuildingDto,
  ) {
    return this.buildingsService.update(id, updateBuildingDto);
  }

  @Delete(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Delete a building' })
  @ApiResponse({ status: 200, description: 'Building successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Building not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Building contains active floor dependencies.',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.buildingsService.delete(id);
  }
}
