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
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'Get all active employee records with pagination' })
  @ApiResponse({ status: 200, description: 'Return paginated employee records.' })
  async findAll(
    @Query() paginationDto: PaginationQueryDto,
    @Query('organizationId') organizationId?: string,
  ) {
    const parsedOrgId = organizationId ? parseInt(organizationId, 10) : undefined;
    return this.employeesService.findAll(paginationDto, parsedOrgId);
  }

  @Get(':id')
  @RequirePermissions('employees:view')
  @ApiOperation({ summary: 'Get employee record by ID' })
  @ApiResponse({ status: 200, description: 'Return employee record details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Employee record not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employeesService.findOne(id);
  }

  @Post()
  @RequirePermissions('employees:create')
  @ApiOperation({ summary: 'Hire/assign a user as an employee under an organization' })
  @ApiResponse({ status: 201, description: 'Employee successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: User or Organization not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: User already hired or Employee Code in use.',
  })
  async create(
    @Body() createEmployeeDto: CreateEmployeeDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.employeesService.create(createEmployeeDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('employees:update')
  @ApiOperation({ summary: 'Update employee record details' })
  @ApiResponse({ status: 200, description: 'Employee record updated successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Employee record, User, or Organization not found.',
  })
  @ApiResponse({ status: 409, description: 'Conflict: Employee Code already in use.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEmployeeDto: UpdateEmployeeDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.employeesService.update(id, updateEmployeeDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('employees:delete')
  @ApiOperation({ summary: 'Delete an employee record (soft delete)' })
  @ApiResponse({ status: 200, description: 'Employee record successfully soft-deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Employee record not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.employeesService.delete(id, currentUser?.email);
  }
}
