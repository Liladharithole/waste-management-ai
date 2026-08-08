import { Test, TestingModule } from '@nestjs/testing';
import { SiteSettingsService } from './site-settings.service';
import { SiteSettingsRepository } from './repositories/site-settings.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';

describe('SiteSettingsService', () => {
  let service: SiteSettingsService;

  const mockRepository = {
    findBySiteId: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const mockPrismaCore = {
    site: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SiteSettingsService,
        { provide: SiteSettingsRepository, useValue: mockRepository },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<SiteSettingsService>(SiteSettingsService);

    jest.clearAllMocks();
  });

  it('should return system default SLA settings when site has no custom settings', async () => {
    mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1, name: 'Site 1', deletedAt: null });
    mockRepository.findBySiteId.mockResolvedValue(null);

    const result = await service.getSettings(1);

    expect(result.siteId).toBe(1);
    expect(result.highPrioritySlaHours).toBe(24);
    expect(result.lowPrioritySlaHours).toBe(48);
    expect(result.source).toBe('SYSTEM_DEFAULT');
  });

  it('should update site custom settings', async () => {
    mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1, name: 'Site 1', deletedAt: null });
    mockRepository.upsert.mockResolvedValue({
      siteId: 1,
      highPrioritySlaHours: 6,
      lowPrioritySlaHours: 12,
    });

    const result = await service.updateSettings(1, {
      highPrioritySlaHours: 6,
      lowPrioritySlaHours: 12,
    });

    expect(result.highPrioritySlaHours).toBe(6);
    expect(result.lowPrioritySlaHours).toBe(12);
  });
});
