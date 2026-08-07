import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './dto/send-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Notifications Engine')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @RequirePermissions('notifications:create')
  @ApiOperation({ summary: 'Send a real-time notification (In-App Socket + Email)' })
  async sendNotification(@Body() dto: SendNotificationDto, @Request() req: any) {
    const createdBy = req.user?.sub ? `user:${req.user.sub}` : 'SYSTEM';
    return this.notificationsService.sendNotification(dto, createdBy);
  }

  @Get()
  @RequirePermissions('notifications:view')
  @ApiOperation({ summary: 'Get paginated in-app notifications for authenticated user' })
  async getUserNotifications(@Query() query: QueryNotificationsDto, @Request() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.getUserNotifications(userId, query);
  }

  @Get('unread-count')
  @RequirePermissions('notifications:view')
  @ApiOperation({ summary: 'Get unread notification badge count for authenticated user' })
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  @RequirePermissions('notifications:update')
  @ApiOperation({ summary: 'Mark specific in-app notification as read' })
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('read-all')
  @RequirePermissions('notifications:update')
  @ApiOperation({ summary: 'Mark all in-app notifications as read' })
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.sub;
    return this.notificationsService.markAllAsRead(userId);
  }
}
