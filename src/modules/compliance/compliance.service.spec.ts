import { Test, TestingModule } from '@nestjs/testing';
import { ComplianceService } from './compliance.service';
import { ComplianceDocumentsRepository } from './repositories/compliance-documents.repository';
import { ComplianceDocStatus, ComplianceEntityType } from '@prisma/client-central-core';

describe('ComplianceService', () => {
  let service: ComplianceService;

  const mockRepo = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    softDelete: jest.fn(),
    findActiveDocsForEntity: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplianceService,
        { provide: ComplianceDocumentsRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ComplianceService>(ComplianceService);

    jest.clearAllMocks();
  });

  describe('createDocument', () => {
    it('should create and return compliance document', async () => {
      const dto = {
        organizationId: 1,
        entityType: ComplianceEntityType.VEHICLE,
        entityId: 10,
        documentType: 'INSURANCE',
        expiryDate: '2026-12-31',
      };
      mockRepo.create.mockResolvedValue({ id: 1, ...dto });

      const result = await service.createDocument(dto);
      expect(result.id).toBe(1);
      expect(mockRepo.create).toHaveBeenCalledWith(dto, undefined);
    });
  });

  describe('checkEntityCompliance', () => {
    it('should return isCompliant true when all required docs are valid and unexpired', async () => {
      mockRepo.findActiveDocsForEntity.mockResolvedValue([
        {
          documentType: 'INSURANCE',
          status: ComplianceDocStatus.VALID,
          expiryDate: new Date('2028-12-31'),
        },
        {
          documentType: 'PUC',
          status: ComplianceDocStatus.VALID,
          expiryDate: new Date('2028-12-31'),
        },
      ]);

      const result = await service.checkEntityCompliance(ComplianceEntityType.VEHICLE, 10, [
        'INSURANCE',
        'PUC',
      ]);

      expect(result.isCompliant).toBe(true);
      expect(result.missingOrExpiredDocs).toHaveLength(0);
    });

    it('should return isCompliant false when a required doc is missing or expired', async () => {
      mockRepo.findActiveDocsForEntity.mockResolvedValue([
        {
          documentType: 'INSURANCE',
          status: ComplianceDocStatus.VALID,
          expiryDate: new Date('2028-12-31'),
        },
      ]);

      const result = await service.checkEntityCompliance(ComplianceEntityType.VEHICLE, 10, [
        'INSURANCE',
        'PUC',
      ]);

      expect(result.isCompliant).toBe(false);
      expect(result.missingOrExpiredDocs).toContain('PUC');
    });
  });
});
