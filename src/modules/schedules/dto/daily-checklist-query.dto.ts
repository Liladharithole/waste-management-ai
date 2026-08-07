import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class DailyChecklistQueryDto {
  @ApiPropertyOptional({
    example: 10,
    description: 'Filter checklist for specific assigned employee/driver ID',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedEmployeeId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter checklist for specific site ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({
    example: '2026-08-08',
    description: 'Target date (YYYY-MM-DD or ISO string, defaults to today)',
  })
  @IsOptional()
  @IsDateString()
  date?: string;
}
