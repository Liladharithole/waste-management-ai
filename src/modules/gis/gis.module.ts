import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GisService } from './gis.service';
import { GisController } from './gis.controller';
import { GisGateway } from './gis.gateway';
import { RedisPubSubService } from './services/redis-pubsub.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';
import { GoogleMapsModule } from '../google-maps/google-maps.module';

@Module({
  imports: [
    PrismaModule,
    PrismaCentralCoreModule,
    GoogleMapsModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [GisController],
  providers: [GisService, GisGateway, RedisPubSubService],
  exports: [GisService, GisGateway, RedisPubSubService],
})
export class GisModule {}
