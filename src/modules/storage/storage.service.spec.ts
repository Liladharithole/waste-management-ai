import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePresignedUrl', () => {
    it('should generate valid uploadUrl and public fileUrl structure', async () => {
      const result = await service.generatePresignedUrl({
        filename: 'truck_puc_cert.pdf',
        contentType: 'application/pdf',
        folder: 'compliance',
      });

      expect(result).toHaveProperty('uploadUrl');
      expect(result).toHaveProperty('fileUrl');
      expect(result).toHaveProperty('key');
      expect(result.fileUrl).toContain('.s3.');
      expect(result.key).toContain('compliance/');
    });
  });
});
