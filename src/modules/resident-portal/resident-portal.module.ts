import { Module } from '@nestjs/common';
import { ResidentPortalService } from './resident-portal.service';
import { ResidentPortalController } from './resident-portal.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaModule, PrismaCentralCoreModule],
  controllers: [ResidentPortalController],
  providers: [ResidentPortalService],
  exports: [ResidentPortalService],
})
export class ResidentPortalModule {}
