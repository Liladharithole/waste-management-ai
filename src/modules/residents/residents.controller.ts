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
import { ResidentsService } from './residents.service';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Residents')
@ApiBearerAuth()
@Controller('residents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ResidentsController {
  constructor(private readonly residentsService: ResidentsService) {}

  @Get()
  @RequirePermissions('residents:view')
  @ApiOperation({ summary: 'Get all active resident mappings with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated resident records.' })
  async findAll(@Query() paginationDto: PaginationQueryDto, @Query('unitId') unitId?: string) {
    const parsedUnitId = unitId ? parseInt(unitId, 10) : undefined;
    return this.residentsService.findAll(paginationDto, parsedUnitId);
  }

  @Get(':id')
  @RequirePermissions('residents:view')
  @ApiOperation({ summary: 'Get resident record by ID' })
  @ApiResponse({ status: 200, description: 'Return resident record details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Resident mapping not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.residentsService.findOne(id);
  }

  @Post()
  @RequirePermissions('residents:create')
  @ApiOperation({ summary: 'Assign a user as a resident to a space unit' })
  @ApiResponse({ status: 201, description: 'Resident successfully assigned.' })
  @ApiResponse({ status: 404, description: 'Not Found: User or Unit not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: User is already assigned as a resident.' })
  async create(
    @Body() createResidentDto: CreateResidentDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.residentsService.create(createResidentDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('residents:update')
  @ApiOperation({ summary: 'Update resident assignment details' })
  @ApiResponse({ status: 200, description: 'Resident record updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Resident record, User, or Unit not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateResidentDto: UpdateResidentDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.residentsService.update(id, updateResidentDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('residents:delete')
  @ApiOperation({ summary: 'Delete a resident assignment (soft delete)' })
  @ApiResponse({ status: 200, description: 'Resident record successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Resident record not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.residentsService.delete(id, currentUser?.email);
  }
}
