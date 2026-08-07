import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { VehicleStatus, VehicleType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ example: 1, description: 'Organization ID owning this vehicle' })
  @IsInt()
  @Min(1)
  organizationId!: number;

  @ApiProperty({ example: 'MH-12-AB-1234', description: 'Unique vehicle registration number' })
  @IsString()
  @IsNotEmpty()
  registrationNumber!: string;

  @ApiProperty({ enum: VehicleType, example: VehicleType.COMPACTOR_TRUCK })
  @IsEnum(VehicleType)
  vehicleType!: VehicleType;

  @ApiProperty({ example: 5.0, description: 'Payload capacity limit in metric tons' })
  @IsNumber()
  @Min(0.1)
  capacityMetricTons!: number;

  @ApiPropertyOptional({ enum: VehicleStatus, example: VehicleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ example: 'DIESEL', description: 'Fuel type (DIESEL, CNG, ELECTRIC)' })
  @IsOptional()
  @IsString()
  fuelType?: string;
}
