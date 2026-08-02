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
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Organizations')
@ApiBearerAuth()
@Controller('organizations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @RequirePermissions('organizations:view')
  @ApiOperation({ summary: 'Get all organizations' })
  @ApiResponse({
    status: 200,
    description: 'Return all organizations with settings and addresses.',
  })
  async findAll() {
    return this.organizationsService.findAll();
  }

  @Get('address-suggestions')
  @RequirePermissions('organizations:view')
  @ApiOperation({ summary: 'Get address suggestions for organizations via Google Places API' })
  @ApiResponse({ status: 200, description: 'Return address suggestions.' })
  async getAddressSuggestions(@Query('input') input: string) {
    if (!input) {
      return { suggestions: [] };
    }
    return this.organizationsService.getAddressSuggestions(input);
  }

  @Post()
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Create a new organization, settings, and default address' })
  @ApiResponse({ status: 201, description: 'Organization successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request: Validation failed.' })
  @ApiResponse({ status: 409, description: 'Conflict: Name already exists.' })
  async create(@Body() createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Patch(':id')
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Update organization properties' })
  @ApiResponse({ status: 200, description: 'Organization updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Organization not found.' })
  @ApiResponse({ status: 409, description: 'Conflict: Name already in use.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ) {
    return this.organizationsService.update(id, updateOrganizationDto);
  }

  @Delete(':id')
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Delete an organization' })
  @ApiResponse({ status: 200, description: 'Organization successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Organization not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Organization is linked to active employees or societies.',
  })
  async delete(@Param('id', ParseIntPipe) id: number) {
    return this.organizationsService.delete(id);
  }

  @Post(':id/addresses')
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Add a new address to an organization' })
  @ApiResponse({ status: 201, description: 'Address successfully created.' })
  @ApiResponse({ status: 404, description: 'Not Found: Organization not found.' })
  async addAddress(@Param('id', ParseIntPipe) id: number, @Body() addAddressDto: AddAddressDto) {
    return this.organizationsService.addAddress(id, addAddressDto);
  }

  @Patch(':id/addresses/:addressId')
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Update an organization address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Address not found.' })
  async updateAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.organizationsService.updateAddress(id, addressId, updateAddressDto);
  }

  @Delete(':id/addresses/:addressId')
  @RequirePermissions('organizations:manage')
  @ApiOperation({ summary: 'Delete an organization address' })
  @ApiResponse({ status: 200, description: 'Address successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Not Found: Address not found.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict: Cannot delete default address or the only address.',
  })
  async deleteAddress(
    @Param('id', ParseIntPipe) id: number,
    @Param('addressId', ParseIntPipe) addressId: number,
  ) {
    return this.organizationsService.deleteAddress(id, addressId);
  }
}
