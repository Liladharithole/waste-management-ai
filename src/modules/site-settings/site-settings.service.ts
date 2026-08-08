import { Injectable, NotFoundException } from '@nestjs/common';
import { SiteSettingsRepository } from './repositories/site-settings.repository';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

@Injectable()
export class SiteSettingsService {
  constructor(
    private readonly siteSettingsRepository: SiteSettingsRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  /**
   * Validates site existence before modifying settings.
   */
  private async ensureSiteExists(siteId: number) {
    const site = await this.prismaCore.site.findUnique({
      where: { id: siteId },
    });
    if (!site || site.deletedAt) {
      throw new NotFoundException(`Site with ID ${siteId} not found.`);
    }
    return site;
  }

  /**
   * Retrieves configuration settings for a site (or defaults).
   */
  async getSettings(siteId: number) {
    await this.ensureSiteExists(siteId);
    const settings = await this.siteSettingsRepository.findBySiteId(siteId);

    if (!settings) {
      return {
        siteId,
        highPrioritySlaHours: 24,
        lowPrioritySlaHours: 48,
        isCustomSetting: false,
        source: 'SYSTEM_DEFAULT',
      };
    }

    return {
      ...settings,
      isCustomSetting: true,
      source: `SITE_${siteId}`,
    };
  }

  /**
   * Updates configuration settings for a site.
   */
  async updateSettings(siteId: number, dto: UpdateSiteSettingsDto, updatedBy?: string) {
    await this.ensureSiteExists(siteId);
    return this.siteSettingsRepository.upsert(siteId, {
      ...dto,
      updatedBy,
    });
  }

  /**
   * Resets configuration settings for a site back to system defaults.
   */
  async resetSettings(siteId: number) {
    await this.ensureSiteExists(siteId);
    try {
      await this.siteSettingsRepository.delete(siteId);
    } catch {
      // Ignore if record did not exist
    }
    return {
      message: `Site ${siteId} configuration reset to system defaults.`,
      highPrioritySlaHours: 24,
      lowPrioritySlaHours: 48,
    };
  }
}
