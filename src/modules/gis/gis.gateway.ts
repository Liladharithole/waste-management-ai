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
import { RedisPubSubService } from './services/redis-pubsub.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GisGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GisGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisPubSub: RedisPubSubService,
    private readonly prismaMain: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly googleMapsService: GoogleMapsService,
  ) {
    // Subscribe to Redis PubSub stream to sync multi-node WebSocket events
    void this.redisPubSub.subscribe('fleet:location:stream', (channel, message) => {
      try {
        const data = JSON.parse(message);
        if (data && this.server) {
          const targetOrgIds: number[] = data.targetOrgIds || [data.organizationId];

          // Broadcast to all target organization rooms (Primary Truck Owner + Shift Site Owner)
          for (const orgId of targetOrgIds) {
            this.server.to(`org:${orgId}:fleet`).emit('fleet:location_changed', data);
          }

          // Also broadcast to global fleet room for Super-Admins
          this.server.to('room:global_fleet').emit('fleet:location_changed', data);
        }
      } catch (err: any) {
        this.logger.error(`Error processing Redis PubSub message: ${err.message}`);
      }
    });
  }

  async handleConnection(client: Socket) {
    try {
      const authHeader = client.handshake.auth?.token || client.handshake.headers?.authorization;

      if (!authHeader) {
        this.logger.warn(
          `Unauthorized WebSocket connection attempt (No token). Socket ID: ${client.id}`,
        );
        client.disconnect();
        return;
      }

      const token = authHeader.replace(/^Bearer\s+/i, '');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });

      client.data = { user: payload };
      this.logger.log(`✅ WebSocket Client Connected: ${client.id} (User ID: ${payload.sub})`);
    } catch (err: any) {
      this.logger.warn(`WebSocket Authentication Failed for ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`🔌 WebSocket Client Disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe:fleet_map')
  handleSubscribeFleetMap(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId?: number; isGlobal?: boolean },
  ) {
    if (data?.isGlobal) {
      void client.join('room:global_fleet');
      this.logger.log(`Socket ${client.id} joined room: room:global_fleet`);
      return { event: 'subscribed', room: 'room:global_fleet' };
    }

    const orgId = data?.organizationId || 1;
    const roomName = `org:${orgId}:fleet`;
    void client.join(roomName);
    this.logger.log(`Socket ${client.id} joined room: ${roomName}`);
    return { event: 'subscribed', room: roomName };
  }

  @SubscribeMessage('unsubscribe:fleet_map')
  handleUnsubscribeFleetMap(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { organizationId?: number; isGlobal?: boolean },
  ) {
    if (data?.isGlobal) {
      void client.leave('room:global_fleet');
      this.logger.log(`Socket ${client.id} left room: room:global_fleet`);
      return { event: 'unsubscribed', room: 'room:global_fleet' };
    }

    const orgId = data?.organizationId || 1;
    const roomName = `org:${orgId}:fleet`;
    void client.leave(roomName);
    this.logger.log(`Socket ${client.id} left room: ${roomName}`);
    return { event: 'unsubscribed', room: roomName };
  }

  @SubscribeMessage('driver:location_update')
  async handleDriverLocationUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      dispatchId: number;
      vehicleId: number;
      latitude: number;
      longitude: number;
      speedKmH?: number;
      heading?: number;
      timestamp?: string;
    },
  ) {
    try {
      const dispatch = await this.prismaMain.dispatchAssignment.findFirst({
        where: { id: payload.dispatchId, deletedAt: null },
        include: { vehicle: true, schedule: true },
      });

      if (!dispatch) {
        return { error: `Dispatch ID ${payload.dispatchId} not found.` };
      }

      // 1. Persist full journey GPS breadcrumb to MySQL database
      await this.prismaMain.vehicleLocationLog.create({
        data: {
          dispatchId: dispatch.id,
          vehicleId: dispatch.vehicle.id,
          latitude: payload.latitude,
          longitude: payload.longitude,
          speedKmH: payload.speedKmH || 0.0,
          heading: payload.heading || 0.0,
          recordedAt: payload.timestamp ? new Date(payload.timestamp) : new Date(),
        },
      });

      // 2. Check for Speeding Violation Alert (> 60 km/h)
      if (payload.speedKmH && payload.speedKmH > 60) {
        await this.prismaCore.notificationLog.create({
          data: {
            userId: client.data?.user?.sub || 1,
            title: `⚠️ SPEEDING ALERT: Truck ${dispatch.vehicle.registrationNumber}`,
            body: `Vehicle clocked ${payload.speedKmH} km/h at GPS (${payload.latitude}, ${payload.longitude}), exceeding 60 km/h limit!`,
            type: 'SPEEDING_ALERT',
            status: 'SENT',
            createdBy: `dispatch:${dispatch.id}`,
          },
        });
      }

      // Lookup site in central_core_db to get shift's organizationId and site address for ETA
      let shiftOrgId: number | null = null;
      let etaInfo: { distanceKm: number; etaMinutes: number; etaTimestamp: string } | null = null;

      if (dispatch.schedule?.siteId) {
        const site = await this.prismaCore.site.findFirst({
          where: { id: dispatch.schedule.siteId, deletedAt: null },
        });
        if (site) {
          shiftOrgId = site.organizationId;
          if (site.latitude && site.longitude) {
            etaInfo = await this.googleMapsService.calculateEtaAndDistance(
              payload.latitude,
              payload.longitude,
              site.latitude,
              site.longitude,
            );
          }
        }
      }

      const driver = await this.prismaCore.employee.findFirst({
        where: { id: dispatch.driverEmployeeId, deletedAt: null },
        include: { user: true },
      });

      // Target Orgs = Primary Vehicle Owner Org + Active Shift Site Owner Org
      const targetOrgIds = Array.from(
        new Set(
          [dispatch.vehicle.organizationId, shiftOrgId].filter(
            (id): id is number => id !== null && id !== undefined,
          ),
        ),
      );

      const enrichedData = {
        dispatchId: dispatch.id,
        vehicleId: dispatch.vehicle.id,
        registrationNumber: dispatch.vehicle.registrationNumber,
        vehicleType: dispatch.vehicle.vehicleType,
        organizationId: dispatch.vehicle.organizationId,
        targetOrgIds,
        driverName: driver?.user
          ? `${driver.user.firstName || ''} ${driver.user.lastName || ''}`.trim()
          : 'Driver',
        latitude: payload.latitude,
        longitude: payload.longitude,
        speedKmH: payload.speedKmH || 0,
        heading: payload.heading || 0,
        etaToNextTargetSite: etaInfo,
        timestamp: payload.timestamp || new Date().toISOString(),
      };

      // 3. Publish to Redis channel (Multi-node scaling)
      await this.redisPubSub.publish('fleet:location:stream', enrichedData);

      // 4. Broadcast directly to target organization rooms on current node
      for (const orgId of targetOrgIds) {
        this.server.to(`org:${orgId}:fleet`).emit('fleet:location_changed', enrichedData);
      }
      this.server.to('room:global_fleet').emit('fleet:location_changed', enrichedData);

      return { success: true, timestamp: enrichedData.timestamp, targetOrgIds, eta: etaInfo };
    } catch (err: any) {
      this.logger.error(`Failed to process driver location update: ${err.message}`);
      return { error: err.message };
    }
  }
}
