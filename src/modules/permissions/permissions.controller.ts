import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { AssignPermissionDto } from './dto/assign-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Permissions')
@ApiBearerAuth()
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions:view')
  @ApiOperation({ summary: 'Get all system permissions' })
  @ApiResponse({ status: 200, description: 'Return all permissions.' })
  async findAll() {
    return this.permissionsService.findAll();
  }

  @Post()
  @RequirePermissions('permissions:manage')
  @ApiOperation({ summary: 'Create a new permission' })
  @ApiResponse({ status: 201, description: 'Permission successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict: Permission already exists.' })
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Delete(':id')
  @RequirePermissions('permissions:manage')
  @ApiOperation({ summary: 'Delete a permission' })
  @ApiResponse({ status: 200, description: 'Permission successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Permission not found.' })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.permissionsService.delete(id);
  }

  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('permissions:manage')
  @ApiOperation({ summary: 'Assign a permission to a role' })
  @ApiResponse({ status: 200, description: 'Permission successfully assigned to role.' })
  @ApiResponse({ status: 404, description: 'Not Found: Role or Permission not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Permission already assigned.' })
  async assign(@Body() assignPermissionDto: AssignPermissionDto) {
    return this.permissionsService.assign(assignPermissionDto);
  }

  @Post('revoke')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('permissions:manage')
  @ApiOperation({ summary: 'Revoke a permission from a role' })
  @ApiResponse({ status: 200, description: 'Permission successfully revoked from role.' })
  @ApiResponse({ status: 404, description: 'Not Found: Mapping not found.' })
  async revoke(@Body() assignPermissionDto: AssignPermissionDto) {
    return this.permissionsService.revoke(assignPermissionDto);
  }
}
