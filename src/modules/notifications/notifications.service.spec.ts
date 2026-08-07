import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { EmailNotificationService } from './services/email-notification.service';
import { NotificationGateway } from './notifications.gateway';

describe('NotificationsService', () => {
  let service: NotificationsService;

  const mockRepository = {
    create: jest.fn(),
    findByUserId: jest.fn(),
    getUnreadCount: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
  };

  const mockEmailService = {
    sendEmail: jest.fn(),
  };

  const mockGateway = {
    sendRealtimeNotification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: mockRepository },
        { provide: EmailNotificationService, useValue: mockEmailService },
        { provide: NotificationGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendNotification', () => {
    it('should create notification, push socket event, and send email if recipientEmail provided', async () => {
      const mockRecord = {
        id: 1,
        userId: 10,
        title: 'Document Expired',
        body: 'PUC Certificate expired.',
        type: 'COMPLIANCE_EXPIRED',
        status: 'SENT',
      };
      mockRepository.create.mockResolvedValue(mockRecord);
      mockEmailService.sendEmail.mockResolvedValue({ success: true });

      const result = await service.sendNotification(
        {
          userId: 10,
          title: 'Document Expired',
          body: 'PUC Certificate expired.',
          type: 'COMPLIANCE_EXPIRED',
          recipientEmail: 'driver@example.com',
        },
        'SYSTEM',
      );

      expect(result).toEqual(mockRecord);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 10, title: 'Document Expired' }),
      );
      expect(mockGateway.sendRealtimeNotification).toHaveBeenCalledWith(10, mockRecord);
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        'driver@example.com',
        'Document Expired',
        expect.any(String),
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockRepository.getUnreadCount.mockResolvedValue(3);
      const result = await service.getUnreadCount(10);
      expect(result).toEqual({ userId: 10, unreadCount: 3 });
    });
  });
});
