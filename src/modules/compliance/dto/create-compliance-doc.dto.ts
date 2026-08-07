import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';
import { ComplianceEntityType } from '@prisma/client-central-core';

export class CreateComplianceDocDto {
  @ApiProperty({ example: 1, description: 'Organization ID owning this compliance doc' })
  @IsInt()
  @Min(1)
  organizationId!: number;

  @ApiProperty({ enum: ComplianceEntityType, example: ComplianceEntityType.VEHICLE })
  @IsEnum(ComplianceEntityType)
  entityType!: ComplianceEntityType;

  @ApiProperty({ example: 10, description: 'Target Vehicle ID or Employee ID' })
  @IsInt()
  @Min(1)
  entityId!: number;

  @ApiProperty({
    example: 'INSURANCE',
    description: 'Document type (e.g. INSURANCE, PUC, ROAD_TAX, DRIVING_LICENSE)',
  })
  @IsString()
  @IsNotEmpty()
  documentType!: string;

  @ApiPropertyOptional({
    example: 'POL-99887766',
    description: 'Document policy / certificate number',
  })
  @IsOptional()
  @IsString()
  documentNumber?: string;

  @ApiPropertyOptional({
    example: 'https://storage.provider.com/docs/puc_10.pdf',
    description: 'Scanned document file URL',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  documentUrl?: string;

  @ApiPropertyOptional({ example: '2025-01-01', description: 'Issue date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  issueDate?: string;

  @ApiProperty({ example: '2026-12-31', description: 'Expiry date (YYYY-MM-DD)' })
  @IsString()
  @IsNotEmpty()
  expiryDate!: string;
}
