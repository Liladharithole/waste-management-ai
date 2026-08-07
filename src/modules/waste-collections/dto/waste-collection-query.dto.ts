import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class WasteCollectionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 10, description: 'Filter by collector user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  collectorUserId?: number;

  @ApiPropertyOptional({ example: 25, description: 'Filter by resident user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  residentUserId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filter by waste category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  wasteCategoryId?: number;

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
}
