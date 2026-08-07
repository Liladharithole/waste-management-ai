import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ReportBreakdownDto {
  @ApiProperty({ example: 10, description: 'Active dispatch assignment ID' })
  @IsInt()
  @Min(1)
  dispatchId!: number;

  @ApiProperty({
    example: 'FLAT_TIRE',
    description: 'Breakdown type (FLAT_TIRE, ENGINE_FAILURE, ACCIDENT, FUEL_EMPTY)',
  })
  @IsString()
  @IsNotEmpty()
  breakdownType!: string;

  @ApiProperty({ example: 18.520412, description: 'Breakdown latitude coordinate' })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 73.856743, description: 'Breakdown longitude coordinate' })
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({
    example: 'Rear right tire punctured near Highway 4',
    description: 'Breakdown notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'https://waste-bucket.s3.ap-south-1.amazonaws.com/tire.jpg',
    description: 'Photo URL from S3',
  })
  @IsOptional()
  @IsString()
  photoUrl?: string;
}
