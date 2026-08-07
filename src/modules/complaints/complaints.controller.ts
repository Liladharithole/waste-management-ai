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
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { ComplaintQueryDto } from './dto/complaint-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Complaints')
@ApiBearerAuth()
@Controller('complaints')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @RequirePermissions('complaints:view')
  @ApiOperation({ summary: 'Get all system complaints with pagination and filters' })
  @ApiResponse({ status: 200, description: 'Return paginated list of complaints.' })
  async findAll(@Query() query: ComplaintQueryDto) {
    return this.complaintsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('complaints:view')
  @ApiOperation({ summary: 'Get complaint details by ID' })
  @ApiResponse({ status: 200, description: 'Return complaint details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Complaint record not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.complaintsService.findOne(id);
  }

  @Post()
  @RequirePermissions('complaints:create')
  @ApiOperation({ summary: 'File a new complaint' })
  @ApiResponse({ status: 201, description: 'Complaint successfully filed.' })
  @ApiResponse({ status: 404, description: 'Not Found: Resident user or unit not found.' })
  async create(
    @Body() createDto: CreateComplaintDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.complaintsService.create(createDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('complaints:update')
  @ApiOperation({ summary: 'Update complaint status, assign worker, or record resolution' })
  @ApiResponse({ status: 200, description: 'Complaint updated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Complaint, resident, employee, or unit not found.',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateComplaintDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.complaintsService.update(id, updateDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('complaints:delete')
  @ApiOperation({ summary: 'Delete a complaint record (soft delete)' })
  @ApiResponse({ status: 200, description: 'Complaint record successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Complaint record not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.complaintsService.delete(id, currentUser?.email);
  }
}
