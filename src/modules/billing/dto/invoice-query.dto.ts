import { ApiPropertyOptional } from '@nestjs/swagger';
import { InvoiceStatus, PayerType } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class InvoiceQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: InvoiceStatus,
    description:
      'Filter by invoice status (DRAFT, ISSUED, PAID, OVERDUE, REJECTED_DRAFT, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;

  @ApiPropertyOptional({
    enum: PayerType,
    description: 'Filter by payer type (UNIT, SITE, ORGANIZATION)',
  })
  @IsOptional()
  @IsEnum(PayerType)
  payerType?: PayerType;

  @ApiPropertyOptional({ example: 1, description: 'Filter by site ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Filter by unit ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filter by organization ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ example: '2026-08', description: 'Filter by billing month/period string' })
  @IsOptional()
  @IsString()
  billingMonth?: string;
}
