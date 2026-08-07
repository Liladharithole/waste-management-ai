import { Module } from '@nestjs/common';
import { WasteCategoriesService } from './waste-categories.service';
import { WasteCategoriesController } from './waste-categories.controller';
import { WasteCategoriesRepository } from './repositories/waste-categories.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [WasteCategoriesController],
  providers: [WasteCategoriesService, WasteCategoriesRepository],
  exports: [WasteCategoriesService, WasteCategoriesRepository],
})
export class WasteCategoriesModule {}
