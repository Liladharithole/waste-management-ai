import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class StopCheckpointDto {
  @ApiPropertyOptional({ example: 1, description: 'Target Site ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  siteId?: number;

  @ApiPropertyOptional({ example: 5, description: 'Target Unit ID' })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiProperty({ example: 125.5, description: 'Collected waste weight in kg' })
  @IsNumber()
  @Min(0)
  collectedWeightKg!: number;

  @ApiProperty({ example: 18.520412, description: 'Check-in latitude coordinate' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 73.856743, description: 'Check-in longitude coordinate' })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 'COMPLETED',
    description: 'Checkpoint status (COMPLETED, SKIPPED)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Gate locked', description: 'Reason if skipped' })
  @IsOptional()
  @IsString()
  skipReason?: string;

  @ApiPropertyOptional({
    example: 'https://waste-bucket.s3.ap-south-1.amazonaws.com/photo1.jpg',
    description: 'Photo proof URL',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
