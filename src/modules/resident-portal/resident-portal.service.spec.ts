import { Test, TestingModule } from '@nestjs/testing';
import { ResidentPortalService } from './resident-portal.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('ResidentPortalService', () => {
  let service: ResidentPortalService;

  const mockPrismaMain = {
    wasteCollection: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    wasteInvoice: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    wasteComplaint: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockPrismaCore = {
    resident: {
      findFirst: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResidentPortalService,
        { provide: PrismaService, useValue: mockPrismaMain },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<ResidentPortalService>(ResidentPortalService);

    jest.clearAllMocks();
  });

  describe('fileComplaint', () => {
    it('should create complaint for resident', async () => {
      mockPrismaCore.resident.findFirst.mockResolvedValue({ id: 1, unitId: 10 });
      mockPrismaMain.wasteComplaint.create.mockResolvedValue({
        id: 100,
        complaintType: 'UNCOLLECTED_WASTE',
      });

      const result = await service.fileComplaint(1, {
        organizationId: 1,
        complaintType: 'UNCOLLECTED_WASTE',
        description: 'Bin not emptied',
      });

      expect(result.id).toBe(100);
      expect(mockPrismaMain.wasteComplaint.create).toHaveBeenCalled();
    });
  });
});
