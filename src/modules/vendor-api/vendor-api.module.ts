import { Module } from '@nestjs/common';
import { VendorApiController } from './vendor-api.controller';
import { VendorApiService } from './vendor-api.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VendorApiController],
  providers: [VendorApiService],
  exports: [VendorApiService],
})
export class VendorApiModule {}
