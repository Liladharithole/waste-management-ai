import { Module } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { ComplianceModule } from '../compliance/compliance.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ComplianceModule],
  controllers: [VehiclesController],
  providers: [VehiclesService, VehiclesRepository],
  exports: [VehiclesService, VehiclesRepository],
})
export class VehiclesModule {}
