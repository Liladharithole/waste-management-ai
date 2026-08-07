import { Injectable, Logger } from '@nestjs/common';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly expirySeconds: number;

  constructor() {
    this.region = process.env.AWS_REGION || 'ap-south-1';
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'waste-management-ai-bucket';
    this.expirySeconds = Number(process.env.AWS_S3_PRESIGNED_EXPIRY_SECONDS || 900);

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (
      accessKeyId &&
      secretAccessKey &&
      accessKeyId !== 'your-aws-access-key-id' &&
      secretAccessKey !== 'your-aws-secret-access-key'
    ) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.logger.log(
        `Initialized AWS S3 Client for bucket: ${this.bucketName} in region: ${this.region}`,
      );
    } else {
      this.logger.warn(
        `AWS Credentials not configured or using placeholders in .env. Presigned URLs will run in DEV mock mode.`,
      );
    }
  }

  async generatePresignedUrl(dto: GeneratePresignedUrlDto) {
    const timestamp = Date.now();
    const cleanFilename = dto.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const folderPath = dto.folder ? `${dto.folder.replace(/\/$/, '')}/` : 'documents/';
    const objectKey = `${folderPath}${timestamp}_${cleanFilename}`;

    const publicFileUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}`;

    if (this.s3Client) {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
        ContentType: dto.contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn: this.expirySeconds,
      });

      return {
        uploadUrl,
        fileUrl: publicFileUrl,
        key: objectKey,
        expiresInSeconds: this.expirySeconds,
        headers: {
          'Content-Type': dto.contentType,
        },
      };
    }

    // Dev Fallback URL when AWS credentials are not set
    return {
      uploadUrl: `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${objectKey}?mock-presigned-token=dev-sample-token`,
      fileUrl: publicFileUrl,
      key: objectKey,
      expiresInSeconds: this.expirySeconds,
      headers: {
        'Content-Type': dto.contentType,
      },
      note: 'AWS credentials not configured. Operating in dev mock mode.',
    };
  }
}
