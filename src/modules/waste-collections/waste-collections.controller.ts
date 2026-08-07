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
import { WasteCollectionsService } from './waste-collections.service';
import { CreateWasteCollectionDto } from './dto/create-waste-collection.dto';
import { UpdateWasteCollectionDto } from './dto/update-waste-collection.dto';
import { WasteCollectionQueryDto } from './dto/waste-collection-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Waste Collections')
@ApiBearerAuth()
@Controller('waste-collections')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WasteCollectionsController {
  constructor(private readonly wasteCollectionsService: WasteCollectionsService) {}

  @Get()
  @RequirePermissions('waste_collections:view')
  @ApiOperation({ summary: 'Get all active waste collection logs with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return paginated waste collection logs.' })
  async findAll(@Query() query: WasteCollectionQueryDto) {
    return this.wasteCollectionsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('waste_collections:view')
  @ApiOperation({ summary: 'Get waste collection record by ID' })
  @ApiResponse({ status: 200, description: 'Return waste collection record details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Waste collection record not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wasteCollectionsService.findOne(id);
  }

  @Post()
  @RequirePermissions('waste_collections:create')
  @ApiOperation({ summary: 'Record a new waste collection transaction' })
  @ApiResponse({ status: 201, description: 'Waste collection transaction successfully recorded.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Collector, Resident, or Waste Category not found.',
  })
  async create(
    @Body() createDto: CreateWasteCollectionDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCollectionsService.create(createDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('waste_collections:update')
  @ApiOperation({ summary: 'Update waste collection record details' })
  @ApiResponse({ status: 200, description: 'Waste collection record updated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Record, Collector, Resident, or Category not found.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWasteCollectionDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCollectionsService.update(id, updateDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('waste_collections:delete')
  @ApiOperation({ summary: 'Delete a waste collection record (soft delete)' })
  @ApiResponse({ status: 200, description: 'Waste collection record successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Waste collection record not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCollectionsService.delete(id, currentUser?.email);
  }
}
