import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GisGateway } from './gis.gateway';
import { RedisPubSubService } from './services/redis-pubsub.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { GoogleMapsService } from '../google-maps/google-maps.service';

describe('GisGateway', () => {
  let gateway: GisGateway;

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockRedisPubSub = {
    subscribe: jest.fn(),
    publish: jest.fn(),
  };

  const mockPrismaMain = {
    dispatchAssignment: {
      findFirst: jest.fn(),
    },
    vehicleLocationLog: {
      create: jest.fn(),
    },
  };

  const mockPrismaCore = {
    employee: {
      findFirst: jest.fn(),
    },
    site: {
      findFirst: jest.fn(),
    },
  };

  const mockGoogleMapsService = {
    calculateEtaAndDistance: jest.fn().mockResolvedValue({
      distanceKm: 3.5,
      etaMinutes: 8,
      etaTimestamp: '2026-08-08T03:45:00.000Z',
    }),
  };

  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  const mockSocket: any = {
    id: 'socket-123',
    handshake: { auth: { token: 'Bearer valid-jwt-token' } },
    disconnect: jest.fn(),
    join: jest.fn(),
    leave: jest.fn(),
    data: {},
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GisGateway,
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisPubSubService, useValue: mockRedisPubSub },
        { provide: PrismaService, useValue: mockPrismaMain },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
        { provide: GoogleMapsService, useValue: mockGoogleMapsService },
      ],
    }).compile();

    gateway = module.get<GisGateway>(GisGateway);
    gateway.server = mockServer as any;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleDriverLocationUpdate', () => {
    it('should calculate ETA, create VehicleLocationLog breadcrumb, and broadcast to target org rooms', async () => {
      mockPrismaMain.dispatchAssignment.findFirst.mockResolvedValue({
        id: 10,
        driverEmployeeId: 5,
        vehicle: {
          id: 1,
          registrationNumber: 'MH-12-AB-1234',
          vehicleType: 'COMPACTOR_TRUCK',
          organizationId: 1,
        },
        schedule: { id: 2, siteId: 20 },
      });
      mockPrismaCore.site.findFirst.mockResolvedValue({
        id: 20,
        organizationId: 2,
        latitude: 18.5401,
        longitude: 73.8712,
      });
      mockPrismaCore.employee.findFirst.mockResolvedValue({
        id: 5,
        user: { firstName: 'John', lastName: 'Doe' },
      });
      mockPrismaMain.vehicleLocationLog.create.mockResolvedValue({ id: BigInt(1) });

      const result = await gateway.handleDriverLocationUpdate(mockSocket, {
        dispatchId: 10,
        vehicleId: 1,
        latitude: 18.5204,
        longitude: 73.8567,
        speedKmH: 35,
        heading: 180,
      });

      expect(result.success).toBe(true);
      expect(result.eta?.etaMinutes).toBe(8);
      expect(mockPrismaMain.vehicleLocationLog.create).toHaveBeenCalled();
      expect(mockGoogleMapsService.calculateEtaAndDistance).toHaveBeenCalled();
    });
  });
});
