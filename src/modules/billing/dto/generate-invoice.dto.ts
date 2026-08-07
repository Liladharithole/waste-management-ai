import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PayerType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty({
    enum: PayerType,
    example: PayerType.UNIT,
    description: 'Target payer type (UNIT, SITE, ORGANIZATION)',
  })
  @IsEnum(PayerType)
  @IsNotEmpty({ message: 'Payer type is required' })
  payerType!: PayerType;

  @ApiPropertyOptional({
    example: 1,
    description: 'Target site ID (Required if payerType is SITE or UNIT)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({
    example: 5,
    description: 'Target unit ID (Required if payerType is UNIT)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Target organization ID (Required if payerType is ORGANIZATION)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ example: 25, description: 'Target resident user ID for contact' })
  @IsOptional()
  @IsInt()
  @Min(1)
  residentUserId?: number;

  @ApiProperty({
    example: '2026-08',
    description:
      'Billing period identifier (e.g. 2026-08 for MONTHLY, 2026-W32 for WEEKLY, 2026-08-08 for DAILY)',
  })
  @IsString()
  @IsNotEmpty({ message: 'Billing period identifier is required' })
  billingMonth!: string;

  @ApiPropertyOptional({ example: '2026-08-25', description: 'Invoice payment due date' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
