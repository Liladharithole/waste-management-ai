import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { QueryNotificationsDto } from '../dto/query-notifications.dto';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  async create(data: {
    userId: number;
    title: string;
    body: string;
    type: string;
    status?: string;
    createdBy?: string;
  }) {
    return await this.prismaCore.notificationLog.create({
      data: {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        status: data.status || 'SENT',
        createdBy: data.createdBy || 'SYSTEM',
      },
    });
  }

  async findByUserId(userId: number, query: QueryNotificationsDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
      ...(query.isUnreadOnly ? { readAt: null } : {}),
    };

    const [items, total] = await Promise.all([
      this.prismaCore.notificationLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaCore.notificationLog.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUnreadCount(userId: number) {
    return await this.prismaCore.notificationLog.count({
      where: {
        userId,
        readAt: null,
        deletedAt: null,
      },
    });
  }

  async markAsRead(id: number, userId: number) {
    const record = await this.prismaCore.notificationLog.findFirst({
      where: { id, userId, deletedAt: null },
    });

    if (!record) return null;

    return await this.prismaCore.notificationLog.update({
      where: { id },
      data: { readAt: new Date(), updatedAt: new Date() },
    });
  }

  async markAllAsRead(userId: number) {
    return await this.prismaCore.notificationLog.updateMany({
      where: { userId, readAt: null, deletedAt: null },
      data: { readAt: new Date(), updatedAt: new Date() },
    });
  }
}
