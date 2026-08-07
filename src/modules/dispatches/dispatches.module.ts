import { Module } from '@nestjs/common';
import { DispatchesService } from './dispatches.service';
import { DispatchesController } from './dispatches.controller';
import { DispatchesRepository } from './repositories/dispatches.repository';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [PrismaModule, PrismaCentralCoreModule, VehiclesModule],
  controllers: [DispatchesController],
  providers: [DispatchesService, DispatchesRepository],
  exports: [DispatchesService, DispatchesRepository],
})
export class DispatchesModule {}
