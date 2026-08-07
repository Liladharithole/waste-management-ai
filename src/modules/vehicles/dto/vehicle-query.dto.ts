import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ComplianceStatus, VehicleStatus, VehicleType } from '@prisma/client';

export class VehicleQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organizationId?: number;

  @ApiPropertyOptional({ enum: VehicleType })
  @IsOptional()
  @IsEnum(VehicleType)
  vehicleType?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: ComplianceStatus })
  @IsOptional()
  @IsEnum(ComplianceStatus)
  complianceStatus?: ComplianceStatus;

  @ApiPropertyOptional({ example: 'MH-12' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;
}
