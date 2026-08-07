import { Module } from '@nestjs/common';
import { DriverAppController } from './driver-app.controller';
import { DriverAppService } from './driver-app.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaModule, PrismaCentralCoreModule],
  controllers: [DriverAppController],
  providers: [DriverAppService],
  exports: [DriverAppService],
})
export class DriverAppModule {}
