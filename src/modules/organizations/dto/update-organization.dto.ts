import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({
    description: 'Display name of the organization',
    example: 'Municipal Corporation Pune',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Full legal name of the organization',
    example: 'Pune Municipal Corporation',
    required: false,
  })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({
    description: 'Abbreviation or short code',
    example: 'PMC',
    required: false,
  })
  @IsString()
  @IsOptional()
  shortName?: string;

  @ApiProperty({
    description: 'Type of the organization',
    example: 'GOVERNMENT',
    enum: ['GOVERNMENT', 'PRIVATE', 'NGO', 'OTHER'],
    required: false,
  })
  @IsEnum(['GOVERNMENT', 'PRIVATE', 'NGO', 'OTHER'])
  @IsOptional()
  type?: string;

  @ApiProperty({
    description: 'Status of the organization',
    example: 'ACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    required: false,
  })
  @IsEnum(['ACTIVE', 'INACTIVE'])
  @IsOptional()
  status?: string;
}
