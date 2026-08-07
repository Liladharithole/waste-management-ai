import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { SchedulesRepository } from './repositories/schedules.repository';
import { WasteCategoriesModule } from '../waste-categories/waste-categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, WasteCategoriesModule],
  controllers: [SchedulesController],
  providers: [SchedulesService, SchedulesRepository],
  exports: [SchedulesService, SchedulesRepository],
})
export class SchedulesModule {}
