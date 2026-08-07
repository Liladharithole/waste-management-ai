import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { DashboardRepository } from './repositories/dashboard.repository';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaModule, PrismaCentralCoreModule],
  controllers: [DashboardController],
  providers: [DashboardService, DashboardRepository],
  exports: [DashboardService, DashboardRepository],
})
export class DashboardModule {}
