import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
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
import { UnitsModule } from './modules/units/units.module';
import { ResidentsModule } from './modules/residents/residents.module';
import { EmployeesModule } from './modules/employees/employees.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: createPinoHttpOptions(),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: Number(process.env.THROTTLE_TTL ?? 60000),
        limit: Number(process.env.THROTTLE_LIMIT ?? 100),
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: Number(process.env.REDIS_PORT ?? 6379),
          },
          ttl: Number(process.env.REDIS_TTL ?? 300000),
        }),
      }),
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
    UnitsModule,
    ResidentsModule,
    EmployeesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
