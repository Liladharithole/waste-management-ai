import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { createPinoHttpOptions } from './logger/pino-http.config';
import { PrismaCentralCoreModule } from './prisma-central-core/prisma-central-core.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { RolesModule } from './modules/roles/roles.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { GoogleMapsModule } from './modules/google-maps/google-maps.module';
import { SitesModule } from './modules/sites/sites.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { FloorsModule } from './modules/floors/floors.module';
import { FlatsModule } from './modules/flats/flats.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: createPinoHttpOptions(),
    }),
    PrismaModule,
    PrismaCentralCoreModule,
    AuthModule,
    PermissionsModule,
    RolesModule,
    OrganizationsModule,
    GoogleMapsModule,
    SitesModule,
    BuildingsModule,
    FloorsModule,
    FlatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
