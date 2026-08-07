import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { DispatchStatus } from '@prisma/client';

export class DispatchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicleId?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  driverEmployeeId?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  scheduleId?: number;

  @ApiPropertyOptional({ enum: DispatchStatus })
  @IsOptional()
  @IsEnum(DispatchStatus)
  status?: DispatchStatus;

  @ApiPropertyOptional({ example: '2026-08-08' })
  @IsOptional()
  @IsString()
  dispatchDate?: string;
}
