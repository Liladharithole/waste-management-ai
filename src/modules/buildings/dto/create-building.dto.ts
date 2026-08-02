import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBuildingDto {
  @ApiProperty({ example: 1, description: 'ID of the parent Site' })
  @IsInt()
  @IsNotEmpty({ message: 'Site ID is required' })
  siteId!: number;

  @ApiProperty({ example: 'Tower A', description: 'Name of the building' })
  @IsString()
  @IsNotEmpty({ message: 'Building name is required' })
  name!: string;

  @ApiProperty({ example: 'Wing B', description: 'Wing or block identifier', required: false })
  @IsString()
  @IsOptional()
  wing?: string;
}
