import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 1, description: 'ID of the user account' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: number;

  @ApiProperty({ example: 1, description: 'ID of the employing organization' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId!: number;

  @ApiPropertyOptional({ example: 'EMP-1002', description: 'Unique employee identification code' })
  @IsString()
  @IsOptional()
  employeeCode?: string;

  @ApiPropertyOptional({
    example: 'Waste Collector Driver',
    description: 'Job designation or title',
  })
  @IsString()
  @IsOptional()
  designation?: string;
}
