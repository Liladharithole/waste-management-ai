import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ComplianceDocStatus, ComplianceEntityType } from '@prisma/client-central-core';

export class ComplianceDocQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ enum: ComplianceEntityType })
  @IsOptional()
  @IsEnum(ComplianceEntityType)
  entityType?: ComplianceEntityType;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  entityId?: number;

  @ApiPropertyOptional({ example: 'INSURANCE' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ enum: ComplianceDocStatus })
  @IsOptional()
  @IsEnum(ComplianceDocStatus)
  status?: ComplianceDocStatus;
}
