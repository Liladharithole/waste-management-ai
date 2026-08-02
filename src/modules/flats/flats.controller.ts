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
import { FlatsService } from './flats.service';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Flats')
@ApiBearerAuth()
@Controller('flats')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FlatsController {
  constructor(private readonly flatsService: FlatsService) {}

  @Get()
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get all active flats' })
  @ApiResponse({ status: 200, description: 'Return all flats.' })
  async findAll(@Query('floorId') floorId?: string) {
    const parsedFloorId = floorId ? parseInt(floorId, 10) : undefined;
    return this.flatsService.findAll(parsedFloorId);
  }

  @Get(':id')
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({ summary: 'Get flat by ID' })
  @ApiResponse({ status: 200, description: 'Return flat details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Flat not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.flatsService.findOne(id);
  }

  @Post()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Create a new flat' })
  @ApiResponse({ status: 201, description: 'Flat successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Parent Floor not found.' })
  async create(@Body() createFlatDto: CreateFlatDto) {
    return this.flatsService.create(createFlatDto);
  }

  @Patch(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Update flat details' })
  @ApiResponse({ status: 200, description: 'Flat updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Flat not found.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateFlatDto: UpdateFlatDto) {
    return this.flatsService.update(id, updateFlatDto);
  }

  @Delete(':id')
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Delete a flat' })
  @ApiResponse({ status: 200, description: 'Flat successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Flat not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Flat has assigned active residents.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.flatsService.delete(id);
  }
}
