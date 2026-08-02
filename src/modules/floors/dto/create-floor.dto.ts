import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFloorDto {
  @ApiProperty({ example: 1, description: 'ID of the parent Building' })
  @IsInt()
  @IsNotEmpty({ message: 'Building ID is required' })
  buildingId!: number;

  @ApiProperty({ example: 3, description: 'Numeric floor level' })
  @IsInt()
  @IsNotEmpty({ message: 'Floor number is required' })
  floorNumber!: number;

  @ApiProperty({ example: '3rd Floor', description: 'Display name for the floor', required: false })
  @IsString()
  @IsOptional()
  name?: string;
}
