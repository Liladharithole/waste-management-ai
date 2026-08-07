import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { VendorApiService } from './vendor-api.service';
import { ApiKeyGuard } from './guards/api-key.guard';

@ApiTags('Vendor & Municipal API Key Gateway')
@ApiHeader({ name: 'X-API-KEY', description: 'Vendor partner API secret key' })
@UseGuards(ApiKeyGuard)
@Controller('vendor-api')
export class VendorApiController {
  constructor(private readonly vendorApiService: VendorApiService) {}

  @Get('waste-metrics')
  @ApiOperation({ summary: 'Public/Partner endpoint for municipal waste collection stats' })
  async getWasteMetrics() {
    return this.vendorApiService.getWasteMetrics();
  }

  @Get('fleet-status')
  @ApiOperation({ summary: 'Partner endpoint for fleet availability and compliance status' })
  async getFleetStatus() {
    return this.vendorApiService.getFleetStatus();
  }
}
