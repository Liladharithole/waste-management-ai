import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class FileResidentComplaintDto {
  @ApiProperty({ example: 1, description: 'Organization ID' })
  @IsInt()
  @Min(1)
  organizationId!: number;

  @ApiPropertyOptional({ example: 5, description: 'Resident Unit ID (Optional)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  unitId?: number;

  @ApiProperty({ example: 'UNCOLLECTED_WASTE', description: 'Complaint category / type' })
  @IsString()
  @IsNotEmpty()
  complaintType!: string;

  @ApiProperty({
    example: 'Waste bin was not emptied during morning shift on 8th Aug',
    description: 'Detailed description',
  })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    example: 'https://storage.provider.com/complaints/overflow_bin.jpg',
    description: 'Photo proof URL',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  photoUrl?: string;
}
