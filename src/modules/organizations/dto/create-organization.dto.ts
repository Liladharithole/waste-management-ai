import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Display name / common name of the organization',
    example: 'BMC Mumbai',
  })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiProperty({
    description: 'Full legal name of the organization',
    example: 'Brihanmumbai Municipal Corporation',
  })
  @IsString()
  @IsNotEmpty({ message: 'Full name is required' })
  fullName!: string;

  @ApiProperty({
    description: 'Abbreviation or short code',
    example: 'BMC',
  })
  @IsString()
  @IsNotEmpty({ message: 'Short name is required' })
  shortName!: string;

  @ApiProperty({
    description: 'Type of the organization',
    example: 'GOVERNMENT',
    enum: ['GOVERNMENT', 'PRIVATE', 'NGO', 'OTHER'],
  })
  @IsEnum(['GOVERNMENT', 'PRIVATE', 'NGO', 'OTHER'])
  type!: string;

  // Primary Address Fields
  @ApiProperty({ example: 'BMC Headquarters, Fort' })
  @IsString()
  @IsNotEmpty({ message: 'Address Line 1 is required' })
  addressLine1!: string;

  @ApiProperty({ example: 'Mahapalika Marg', required: false })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'Mumbai' })
  @IsString()
  @IsNotEmpty({ message: 'City is required' })
  city!: string;

  @ApiProperty({ example: 'Maharashtra' })
  @IsString()
  @IsNotEmpty({ message: 'State is required' })
  state!: string;

  @ApiProperty({ example: '400001' })
  @IsString()
  @IsNotEmpty({ message: 'Postal code is required' })
  postalCode!: string;

  @ApiProperty({ example: 'India', default: 'India', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 18.9401 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 72.8348 })
  @IsLongitude()
  longitude!: number;
}
