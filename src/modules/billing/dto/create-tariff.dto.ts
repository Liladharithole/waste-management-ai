import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingFrequency } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateTariffDto {
  @ApiProperty({ example: 'Green Valley Tariff 2026', description: 'Tariff configuration name' })
  @IsString()
  @IsNotEmpty({ message: 'Tariff name is required' })
  name!: string;

  @ApiPropertyOptional({ example: 1, description: 'Optional site ID link' })
  @IsOptional()
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Optional organization ID link' })
  @IsOptional()
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiProperty({ example: 1, description: 'ID of the target waste category' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Waste category ID is required' })
  wasteCategoryId!: number;

  @ApiProperty({ example: 5.0, description: 'Rate in local currency per kg collected' })
  @IsNumber()
  @Min(0)
  ratePerKg!: number;

  @ApiPropertyOptional({ example: 200.0, default: 0, description: 'Base monthly maintenance fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseMonthlyFee?: number;

  @ApiPropertyOptional({
    example: 25.0,
    default: 0,
    description: 'Penalty rate per kg for unsegregated waste',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penaltyRatePerKg?: number;

  @ApiPropertyOptional({
    example: 150.0,
    default: 0,
    description: 'Minimum billing threshold amount',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minimumBillAmount?: number;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Mark as credit/rebate tariff (subtracted from bill when recycling)',
  })
  @IsOptional()
  @IsBoolean()
  isCreditTariff?: boolean;

  @ApiPropertyOptional({
    enum: BillingFrequency,
    default: BillingFrequency.MONTHLY,
    description: 'Billing frequency (DAILY, WEEKLY, MONTHLY)',
  })
  @IsOptional()
  @IsEnum(BillingFrequency)
  billingFrequency?: BillingFrequency;

  @ApiPropertyOptional({ example: true, default: true, description: 'Is tariff active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
