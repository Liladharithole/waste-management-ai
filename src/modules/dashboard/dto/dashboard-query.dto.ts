import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class DashboardQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter metrics by Organization ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ example: '2026-01-01', description: 'Start Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31', description: 'End Date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}
