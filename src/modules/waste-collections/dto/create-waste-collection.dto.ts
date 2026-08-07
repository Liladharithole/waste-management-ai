import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateWasteCollectionDto {
  @ApiProperty({ example: 10, description: 'User ID of the field collector/worker' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Collector user ID is required' })
  collectorUserId!: number;

  @ApiProperty({ example: 25, description: 'User ID of the resident/occupant' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Resident user ID is required' })
  residentUserId!: number;

  @ApiProperty({ example: 1, description: 'ID of the waste category' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Waste category ID is required' })
  wasteCategoryId!: number;

  @ApiProperty({ example: 12.5, description: 'Weight of waste collected in kilograms' })
  @IsNumber()
  @Min(0, { message: 'Weight must be at least 0 kg' })
  @IsNotEmpty({ message: 'Weight is required' })
  weight!: number;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/photos/coll-01.jpg',
    description: 'Photo proof URL',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    example: 'Collected 2 bags of segregated organic waste',
    description: 'Field notes or remarks',
  })
  @IsString()
  @IsOptional()
  remarks?: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Collection completion status',
  })
  @IsBoolean()
  @IsOptional()
  isCollected?: boolean;
}
