import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { AssignRoleDto } from './dto/assign-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('roles:view')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Return all roles.' })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Post()
  @RequirePermissions('roles:manage')
  @ApiOperation({ summary: 'Create a new role definition' })
  @ApiResponse({ status: 201, description: 'Role successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict: Role name already exists.' })
  async create(@Body() createRoleDto: CreateRoleDto) {
    return this.rolesService.create(createRoleDto);
  }

  @Patch(':id')
  @RequirePermissions('roles:manage')
  @ApiOperation({ summary: 'Update a role definition' })
  @ApiResponse({ status: 200, description: 'Role successfully updated.' })
  @ApiResponse({ status: 404, description: 'Not Found: Role not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Name already in use.' })
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(':id')
  @RequirePermissions('roles:manage')
  @ApiOperation({ summary: 'Delete a role definition' })
  @ApiResponse({ status: 200, description: 'Role successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Role not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Role has active user assignments.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.rolesService.delete(id);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:manage')
  @ApiOperation({ summary: 'Assign a role to a user' })
  @ApiResponse({ status: 200, description: 'Role successfully assigned to user.' })
  @ApiResponse({ status: 404, description: 'Not Found: User or Role not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Role already assigned.' })
  async assign(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.assign(assignRoleDto);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:manage')
  @ApiOperation({ summary: 'Revoke a role from a user' })
  @ApiResponse({ status: 200, description: 'Role successfully revoked from user.' })
  @ApiResponse({ status: 404, description: 'Not Found: Assignment not found.' })
  async revoke(@Body() assignRoleDto: AssignRoleDto) {
    return this.rolesService.revoke(assignRoleDto);
  }
}
