import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationGateway } from './notifications.gateway';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly repository: NotificationsRepository,
    private readonly emailService: EmailNotificationService,
    private readonly gateway: NotificationGateway,
  ) {}

  async sendNotification(dto: SendNotificationDto, createdBy: string = 'SYSTEM') {
    // 1. Create DB Notification Log record
    const notification = await this.repository.create({
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      type: dto.type,
      status: 'SENT',
      createdBy,
    });

    // 2. Push Real-Time Socket Event
    this.gateway.sendRealtimeNotification(dto.userId, notification);

    // 3. Dispatch Email Notification if recipientEmail is present
    if (dto.recipientEmail) {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2e7d32;">Waste Management Platform Notification</h2>
          <h3>${dto.title}</h3>
          <p>${dto.body}</p>
          <hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />
          <small style="color: #777;">This is an automated system message. Please do not reply directly to this email.</small>
        </div>
      `;
      void this.emailService.sendEmail(dto.recipientEmail, dto.title, htmlContent);
    }

    return notification;
  }

  async getUserNotifications(userId: number, query: QueryNotificationsDto) {
    return this.repository.findByUserId(userId, query);
  }

  async getUnreadCount(userId: number) {
    const unreadCount = await this.repository.getUnreadCount(userId);
    return { userId, unreadCount };
  }

  async markAsRead(id: number, userId: number) {
    const updated = await this.repository.markAsRead(id, userId);
    if (!updated) {
      throw new NotFoundException(`Notification with ID ${id} not found.`);
    }
    return updated;
  }

  async markAllAsRead(userId: number) {
    await this.repository.markAllAsRead(userId);
    return { success: true, message: 'All notifications marked as read.' };
  }
}
