import { Module } from '@nestjs/common';
import { SitesService } from './sites.service';
import { SitesController } from './sites.controller';
import { AuthModule } from '../auth/auth.module';
import { GoogleMapsModule } from '../google-maps/google-maps.module';

@Module({
  imports: [AuthModule, GoogleMapsModule],
  controllers: [SitesController],
  providers: [SitesService],
  exports: [SitesService],
})
export class SitesModule {}
