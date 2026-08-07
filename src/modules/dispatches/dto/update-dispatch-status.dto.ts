import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { DispatchStatus } from '@prisma/client';

export class UpdateDispatchStatusDto {
  @ApiProperty({ enum: DispatchStatus, example: DispatchStatus.STARTED })
  @IsEnum(DispatchStatus)
  status!: DispatchStatus;

  @ApiPropertyOptional({ example: 45200.5, description: 'Starting odometer reading in km' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startOdometerKm?: number;

  @ApiPropertyOptional({ example: 45245.8, description: 'Ending odometer reading in km' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  endOdometerKm?: number;

  @ApiPropertyOptional({
    example: 'Shift completed cleanly with all stops picked up',
    description: 'Completion remarks',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
