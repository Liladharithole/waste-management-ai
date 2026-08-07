import { ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ComplaintQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ComplaintStatus, description: 'Filter by complaint status' })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ enum: ComplaintPriority, description: 'Filter by priority level' })
  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @ApiPropertyOptional({ example: 25, description: 'Filter by resident user ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  residentUserId?: number;

  @ApiPropertyOptional({ example: 10, description: 'Filter by assigned employee ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  assignedEmployeeId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Filter by unit ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  unitId?: number;
}
