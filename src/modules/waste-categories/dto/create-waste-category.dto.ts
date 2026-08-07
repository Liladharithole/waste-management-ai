import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWasteCategoryDto {
  @ApiProperty({ example: 'Organic Waste', description: 'Unique category name' })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Wet food scraps, garden waste, and biodegradable matter',
    description: 'Category description and disposal guidelines',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
