import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StorageService } from './storage.service';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Cloud Storage')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('presigned-url')
  @ApiOperation({
    summary: 'Generate AWS S3 Presigned Upload URL for direct client photo/PDF uploads',
  })
  @ApiResponse({
    status: 201,
    description: 'Presigned S3 URL generated successfully.',
  })
  async getPresignedUrl(@Body() dto: GeneratePresignedUrlDto) {
    return await this.storageService.generatePresignedUrl(dto);
  }
}
