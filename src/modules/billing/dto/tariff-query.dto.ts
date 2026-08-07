import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingFrequency } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class TariffQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by site ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter by organization ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by waste category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wasteCategoryId?: number;

  @ApiPropertyOptional({ enum: BillingFrequency, description: 'Filter by billing frequency' })
  @IsOptional()
  @IsEnum(BillingFrequency)
  billingFrequency?: BillingFrequency;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
