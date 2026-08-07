import { ApiPropertyOptional } from '@nestjs/swagger';
import { ScheduleFrequency } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ScheduleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by site ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 3, description: 'Filter by building ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  buildingId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by waste category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wasteCategoryId?: number;

  @ApiPropertyOptional({ example: 10, description: 'Filter by assigned employee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedEmployeeId?: number;

  @ApiPropertyOptional({ enum: ScheduleFrequency, description: 'Filter by frequency' })
  @IsOptional()
  @IsEnum(ScheduleFrequency)
  frequency?: ScheduleFrequency;

  @ApiPropertyOptional({ example: true, description: 'Filter by active status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
