import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';

export class WasteSummaryQueryDto {
  @ApiPropertyOptional({
    example: '2026-08-01T00:00:00.000Z',
    description: 'Filter start date ISO string',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-08-31T23:59:59.999Z',
    description: 'Filter end date ISO string',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, description: 'Filter by specific waste category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wasteCategoryId?: number;
}
