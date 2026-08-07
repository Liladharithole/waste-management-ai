import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationGateway } from './notifications.gateway';
import { PrismaCentralCoreModule } from '../../prisma-central-core/prisma-central-core.module';

@Module({
  imports: [
    PrismaCentralCoreModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
      }),
    }),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsRepository,
    EmailNotificationService,
    NotificationGateway,
  ],
  exports: [NotificationsService, NotificationGateway, EmailNotificationService],
})
export class NotificationsModule {}
