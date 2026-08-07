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
import { BillingService } from './billing.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffQueryDto } from './dto/tariff-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Tariffs')
@ApiBearerAuth()
@Controller('tariffs')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TariffsController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermissions('tariffs:view')
  @ApiOperation({ summary: 'Get all waste tariffs with pagination and site/org filters' })
  @ApiResponse({ status: 200, description: 'Return paginated tariffs.' })
  async findAll(@Query() query: TariffQueryDto) {
    return this.billingService.findAllTariffs(query);
  }

  @Get(':id')
  @RequirePermissions('tariffs:view')
  @ApiOperation({ summary: 'Get tariff details by ID' })
  @ApiResponse({ status: 200, description: 'Return tariff details.' })
  @ApiResponse({ status: 404, description: 'Not Found: Tariff not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOneTariff(id);
  }

  @Post()
  @RequirePermissions('tariffs:create')
  @ApiOperation({ summary: 'Create a new site or organization tariff configuration' })
  @ApiResponse({ status: 201, description: 'Tariff created successfully.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found: Site, organization, or waste category not found.',
  })
  async create(@Body() createDto: CreateTariffDto, @CurrentUser() currentUser: { email?: string }) {
    return this.billingService.createTariff(createDto, currentUser?.email);
  }

  @Patch(':id')
  @RequirePermissions('tariffs:update')
  @ApiOperation({ summary: 'Update tariff rates or billing frequency' })
  @ApiResponse({ status: 200, description: 'Tariff updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Tariff not found.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateTariffDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.updateTariff(id, updateDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('tariffs:delete')
  @ApiOperation({ summary: 'Soft-delete a tariff configuration' })
  @ApiResponse({ status: 200, description: 'Tariff soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Tariff not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.deleteTariff(id, currentUser?.email);
  }
}
