import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';

@Injectable()
export class SiteSettingsRepository {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Finds settings for a given siteId.
   */
  async findBySiteId(siteId: number) {
    return this.prismaCore.siteSettings.findUnique({
      where: { siteId },
    });
  }

  /**
   * Upserts (creates or updates) settings for a siteId.
   */
  async upsert(
    siteId: number,
    data: {
      highPrioritySlaHours?: number;
      lowPrioritySlaHours?: number;
      updatedBy?: string;
    },
  ) {
    return this.prismaCore.siteSettings.upsert({
      where: { siteId },
      create: {
        siteId,
        highPrioritySlaHours: data.highPrioritySlaHours ?? 24,
        lowPrioritySlaHours: data.lowPrioritySlaHours ?? 48,
        updatedBy: data.updatedBy,
      },
      update: {
        ...(data.highPrioritySlaHours !== undefined
          ? { highPrioritySlaHours: data.highPrioritySlaHours }
          : {}),
        ...(data.lowPrioritySlaHours !== undefined
          ? { lowPrioritySlaHours: data.lowPrioritySlaHours }
          : {}),
        ...(data.updatedBy ? { updatedBy: data.updatedBy } : {}),
      },
    });
  }

  /**
   * Resets settings for a siteId back to default.
   */
  async delete(siteId: number) {
    return this.prismaCore.siteSettings.delete({
      where: { siteId },
    });
  }
}
