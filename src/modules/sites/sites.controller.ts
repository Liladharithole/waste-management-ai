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
import { Throttle } from '@nestjs/throttler';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Sites')
@ApiBearerAuth()
@Controller('sites')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get all active residential sites with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated residential sites.' })
  async findAll(
    @Query() paginationDto: PaginationQueryDto,
    @Query('organizationId') organizationId?: string,
  ) {
    const orgId = organizationId ? parseInt(organizationId, 10) : undefined;
    return this.sitesService.findAll(paginationDto, orgId);
  }

  @Throttle({ default: { limit: 15, ttl: 60000 } })
  @Get('address-suggestions')
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get address suggestions for site creation via Google Places API' })
  @ApiResponse({ status: 200, description: 'Return address suggestions.' })
  async getAddressSuggestions(@Query('input') input: string) {
    if (!input) {
      return { suggestions: [] };
    }
    return this.sitesService.getAddressSuggestions(input);
  }

  @Get(':id')
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get site by ID' })
  @ApiResponse({ status: 200, description: 'Return site details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Site not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.findOne(id);
  }

  @Post()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Create a new site' })
  @ApiResponse({ status: 201, description: 'Site successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Owning Organization not found.' })
  async create(@Body() createSiteDto: CreateSiteDto) {
    return this.sitesService.create(createSiteDto);
  }

  @Patch(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Update site details' })
  @ApiResponse({ status: 200, description: 'Site updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Site not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateSiteDto: UpdateSiteDto) {
    return this.sitesService.update(id, updateSiteDto);
  }

  @Delete(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Delete a site' })
  @ApiResponse({ status: 200, description: 'Site successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Site not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Site contains active building dependencies.',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.sitesService.delete(id);
  }
}
