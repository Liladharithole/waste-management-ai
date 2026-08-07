import { Test, TestingModule } from '@nestjs/testing';
import { VendorApiService } from './vendor-api.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('VendorApiService', () => {
  let service: VendorApiService;

  const mockPrismaMain = {
    wasteCollection: {
      findMany: jest.fn(),
    },
    wasteVehicle: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [VendorApiService, { provide: PrismaService, useValue: mockPrismaMain }],
    }).compile();

    service = module.get<VendorApiService>(VendorApiService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getWasteMetrics', () => {
    it('should return aggregated waste metrics for partners', async () => {
      mockPrismaMain.wasteCollection.findMany.mockResolvedValue([
        { id: 1, weight: 100, wasteCategory: { name: 'Dry Waste' } },
        { id: 2, weight: 50, wasteCategory: { name: 'Wet Waste' } },
      ]);

      const result = await service.getWasteMetrics();

      expect(result.totalCollectionsCount).toBe(2);
      expect(result.totalWeightKg).toBe(150);
      expect(result.categoryBreakdown.length).toBe(2);
    });
  });
});
