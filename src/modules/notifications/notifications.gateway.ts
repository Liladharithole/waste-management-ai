import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!authHeader) {
        client.disconnect();
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data = { user: payload };
      const userRoom = `user:${payload.sub}:notifications`;
      void client.join(userRoom);
      this.logger.log(`Notifications Socket Connected: ${client.id} (User ID: ${payload.sub})`);
    } catch (err: any) {
      this.logger.warn(`Notifications Auth Failed for ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Notifications Socket Disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:user_notifications')
  handleSubscribeUserNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: number },
  ) {
    const userId = data.userId || client.data?.user?.sub;
    if (userId) {
      const roomName = `user:${userId}:notifications`;
      void client.join(roomName);
      return { event: 'subscribed', room: roomName };
    }
    return { error: 'User ID missing' };
  }

  sendRealtimeNotification(userId: number, notification: any) {
    if (this.server) {
      const roomName = `user:${userId}:notifications`;
      this.server.to(roomName).emit('notification:new', notification);
    }
  }
}
