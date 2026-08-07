import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeneratePresignedUrlDto {
  @ApiProperty({ example: 'truck_insurance_2026.pdf', description: 'Original file name' })
  @IsString()
  @IsNotEmpty()
  filename!: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'MIME content type (e.g. application/pdf, image/jpeg, image/png)',
  })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiPropertyOptional({
    example: 'compliance',
    description: 'Destination storage folder (e.g. compliance, collections, complaints)',
  })
  @IsOptional()
  @IsString()
  folder?: string;
}
