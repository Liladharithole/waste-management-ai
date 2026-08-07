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
import { WasteCategoriesService } from './waste-categories.service';
import { CreateWasteCategoryDto } from './dto/create-waste-category.dto';
import { UpdateWasteCategoryDto } from './dto/update-waste-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Waste Categories')
@ApiBearerAuth()
@Controller('waste-categories')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WasteCategoriesController {
  constructor(private readonly wasteCategoriesService: WasteCategoriesService) {}

  @Get()
  @RequirePermissions('waste_categories:view')
  @ApiOperation({ summary: 'Get all active waste categories with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated waste categories.' })
  async findAll(@Query() paginationDto: PaginationQueryDto) {
    return this.wasteCategoriesService.findAll(paginationDto);
  }

  @Get(':id')
  @RequirePermissions('waste_categories:view')
  @ApiOperation({ summary: 'Get waste category details by ID' })
  @ApiResponse({ status: 200, description: 'Return waste category details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Waste category not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.wasteCategoriesService.findOne(id);
  }

  @Post()
  @RequirePermissions('waste_categories:create')
  @ApiOperation({ summary: 'Create a new waste category' })
  @ApiResponse({ status: 201, description: 'Waste category created successfully.' })
  @ApiResponse({ status: 409, description: 'Conflict: Waste category name already exists.' })
  async create(
    @Body() createDto: CreateWasteCategoryDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCategoriesService.create(createDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('waste_categories:update')
  @ApiOperation({ summary: 'Update waste category details' })
  @ApiResponse({ status: 200, description: 'Waste category updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Waste category not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Waste category name already in use.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateWasteCategoryDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCategoriesService.update(id, updateDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('waste_categories:delete')
  @ApiOperation({ summary: 'Delete a waste category (soft delete)' })
  @ApiResponse({ status: 200, description: 'Waste category successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Waste category not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Category has linked collection records.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.wasteCategoriesService.delete(id, currentUser?.email);
  }
}
