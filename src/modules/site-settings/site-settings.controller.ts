import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SiteSettingsService } from './site-settings.service';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Site Configuration Settings')
@ApiBearerAuth()
@Controller('sites/:siteId/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Get()
  @RequirePermissions('sites:view', 'organizations:view')
  @ApiOperation({
    summary: 'Get configuration settings (SLA hours & custom rules) for a specific site',
  })
  @ApiResponse({ status: 200, description: 'Return site configuration settings.' })
  @ApiResponse({ status: 404, description: 'Not Found: Site not found.' })
  async getSettings(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.siteSettingsService.getSettings(siteId);
  }

  @Patch()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({
    summary: 'Update configuration settings (SLA threshold hours) for a specific site',
  })
  @ApiResponse({ status: 200, description: 'Site configuration updated successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Site not found.' })
  async updateSettings(
    @Param('siteId', ParseIntPipe) siteId: number,
    @Body() dto: UpdateSiteSettingsDto,
    @CurrentUser() user: any,
  ) {
    return this.siteSettingsService.updateSettings(siteId, dto, user?.email);
  }

  @Delete()
  @RequirePermissions('sites:manage', 'organizations:manage')
  @ApiOperation({ summary: 'Reset site configuration settings back to system defaults' })
  @ApiResponse({ status: 200, description: 'Site configuration reset successfully.' })
  async resetSettings(@Param('siteId', ParseIntPipe) siteId: number) {
    return this.siteSettingsService.resetSettings(siteId);
  }
}
