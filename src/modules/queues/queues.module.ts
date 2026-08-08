import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';
import { QueuesController } from './queues.controller';
import { ReportsQueueProcessor } from './processors/reports-queue.processor';
import { BillingQueueProcessor } from './processors/billing-queue.processor';
import { PrismaModule } from '../../prisma/prisma.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
        },
      }),
    }),
    BullModule.registerQueue({ name: 'reports-queue' }, { name: 'billing-queue' }),
    PrismaModule,
    StorageModule,
  ],
  controllers: [QueuesController],
  providers: [QueuesService, ReportsQueueProcessor, BillingQueueProcessor],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}
