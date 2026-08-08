import { Module } from '@nestjs/common';
import { SiteSettingsController } from './site-settings.controller';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsRepository } from './repositories/site-settings.repository';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaCentralCoreModule],
  controllers: [SiteSettingsController],
  providers: [SiteSettingsService, SiteSettingsRepository],
  exports: [SiteSettingsService, SiteSettingsRepository],
})
export class SiteSettingsModule {}
