import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ComplaintPriority } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({ example: 25, description: 'User ID of the resident filing the complaint' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Resident user ID is required' })
  residentUserId!: number;

  @ApiPropertyOptional({ example: 5, description: 'Unit ID where complaint is located' })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiProperty({ example: 'MISSED_COLLECTION', description: 'Complaint classification type' })
  @IsString()
  @IsNotEmpty({ message: 'Complaint type is required' })
  complaintType!: string;

  @ApiProperty({
    example: 'Waste collection skipped for 2 consecutive days',
    description: 'Title of the complaint',
  })
  @IsString()
  @IsNotEmpty({ message: 'Complaint title is required' })
  title!: string;

  @ApiPropertyOptional({
    example: 'The waste bin on 3rd floor was not emptied today.',
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/complaints/c-01.jpg',
    description: 'Photo proof URL',
  })
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional({
    enum: ComplaintPriority,
    default: ComplaintPriority.MEDIUM,
    description: 'Priority level',
  })
  @IsEnum(ComplaintPriority)
  @IsOptional()
  priority?: ComplaintPriority;
}
