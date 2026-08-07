import { Module } from '@nestjs/common';
import { ResidentsService } from './residents.service';
import { ResidentsController } from './residents.controller';
import { ResidentsRepository } from './repositories/residents.repository';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ResidentsController],
  providers: [ResidentsService, ResidentsRepository],
  exports: [ResidentsService, ResidentsRepository],
})
export class ResidentsModule {}
