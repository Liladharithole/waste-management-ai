import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateStopLogDto {
  @ApiPropertyOptional({ example: 1, description: 'Visited Site ID (Optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Visited Unit ID (Optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiProperty({ example: 120.5, description: 'Collected waste weight at stop in kg' })
  @IsNumber()
  @Min(0)
  collectedWeightKg!: number;

  @ApiPropertyOptional({ example: 18.5204, description: 'Driver Checkpoint GPS Latitude' })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ example: 73.8567, description: 'Driver Checkpoint GPS Longitude' })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ example: 'COMPLETED', description: 'Stop status (COMPLETED, SKIPPED)' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Main gate locked', description: 'Reason if stop was skipped' })
  @IsOptional()
  @IsString()
  skipReason?: string;
}
