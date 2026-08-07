import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ComplianceService } from './compliance.service';
import { CreateComplianceDocDto } from './dto/create-compliance-doc.dto';
import { ComplianceDocQueryDto } from './dto/compliance-doc-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Compliance Documents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('compliance-documents')
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Post()
  @RequirePermissions('compliance:create')
  @ApiOperation({ summary: 'Register/Upload a vehicle or driver compliance document' })
  @ApiResponse({ status: 201, description: 'Compliance document created successfully.' })
  async create(@Body() dto: CreateComplianceDocDto, @CurrentUser('email') email: string) {
    return await this.complianceService.createDocument(dto, email);
  }

  @Get()
  @RequirePermissions('compliance:view')
  @ApiOperation({ summary: 'Get paginated list of compliance documents' })
  async findAll(@Query() query: ComplianceDocQueryDto) {
    return await this.complianceService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('compliance:view')
  @ApiOperation({ summary: 'Get compliance document details by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.complianceService.findOne(id);
  }

  @Delete(':id')
  @RequirePermissions('compliance:delete')
  @ApiOperation({ summary: 'Soft-delete compliance document' })
  async remove(@Param('id', ParseIntPipe) id: number, @CurrentUser('email') email: string) {
    return await this.complianceService.remove(id, email);
  }
}
