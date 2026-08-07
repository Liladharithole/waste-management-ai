import { Module } from '@nestjs/common';
import { WasteCollectionsService } from './waste-collections.service';
import { WasteCollectionsController } from './waste-collections.controller';
import { WasteCollectionsRepository } from './repositories/waste-collections.repository';
import { WasteCategoriesModule } from '../waste-categories/waste-categories.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, WasteCategoriesModule],
  controllers: [WasteCollectionsController],
  providers: [WasteCollectionsService, WasteCollectionsRepository],
  exports: [WasteCollectionsService, WasteCollectionsRepository],
})
export class WasteCollectionsModule {}
