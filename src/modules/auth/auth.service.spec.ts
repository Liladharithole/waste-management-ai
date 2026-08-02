import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: JwtService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn((input) => {
      if (typeof input === 'function') {
        return input(mockPrisma);
      }
      return Promise.all(input);
    }),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    decode: jest.fn(),
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaCentralCoreService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaCentralCoreService>(PrismaCentralCoreService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should successfully register a new user with default role', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue({ id: 1, name: 'GENERAL_USER' });
      prisma.user.create.mockResolvedValue({
        id: 1,
        uuid: 'user-uuid',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        status: 'ACTIVE',
        createdAt: new Date(),
      });

      const result = await service.register(registerDto);

      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: registerDto.email, deletedAt: null },
      });
      expect(prisma.role.findUnique).toHaveBeenCalledWith({
        where: { name: 'GENERAL_USER' },
      });
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should throw ConflictException if email is already in use', async () => {
      prisma.user.findFirst.mockResolvedValue({ id: 1, email: 'test@example.com' });

      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });

    it('should throw InternalServerErrorException if default role is not found', async () => {
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.role.findUnique.mockResolvedValue(null);

      await expect(service.register(registerDto)).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login and return tokens', async () => {
      const passwordHash = await bcrypt.hash('password123', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 1,
        uuid: 'user-uuid',
        email: 'test@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        userRoles: [
          {
            role: { name: 'GENERAL_USER' },
          },
        ],
      });

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.refreshToken.create).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for invalid credentials (user not found)', async () => {
      prisma.user.findFirst.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for incorrect password', async () => {
      const wrongHash = await bcrypt.hash('different-password', 10);
      prisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: wrongHash,
        userRoles: [],
      });

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    const refreshDto = { refreshToken: 'valid-refresh-token' };

    it('should return a new access token', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 100000),
        revokedAt: null,
        user: {
          id: 1,
          uuid: 'user-uuid',
          email: 'test@example.com',
          userRoles: [],
        },
      });

      const result = await service.refreshToken(refreshDto);

      expect(result).toHaveProperty('accessToken');
      expect(prisma.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if refresh token is not found', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if refresh token is expired', async () => {
      prisma.refreshToken.findUnique.mockResolvedValue({
        id: 1,
        token: 'valid-refresh-token',
        expiresAt: new Date(Date.now() - 100000),
        revokedAt: null,
        user: { id: 1, userRoles: [] },
      });

      await expect(service.refreshToken(refreshDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('resetPassword', () => {
    const resetDto = { token: 'valid-reset-token', newPassword: 'new-password' };

    it('should successfully reset the password statelessly', async () => {
      jwtService.decode = jest.fn().mockReturnValue({ email: 'test@example.com' });
      prisma.user.findFirst.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        passwordHash: 'old-password-hash',
      });
      jwtService.verify = jest.fn().mockReturnValue(true);

      const result = await service.resetPassword(resetDto);

      expect(result).toHaveProperty('message');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token payload is invalid', async () => {
      jwtService.decode = jest.fn().mockReturnValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logoutAll', () => {
    it('should revoke all refresh tokens for the given user', async () => {
      prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.logoutAll(1);

      expect(result).toHaveProperty('message', 'Logged out successfully from all devices');
      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 1, revokedAt: null },
        data: { revokedAt: expect.any(Date) },
      });
    });
  });
});
