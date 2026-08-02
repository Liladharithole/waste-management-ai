import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSiteDto {
  @ApiProperty({ example: 1, description: 'ID of the owning organization' })
  @IsInt()
  @IsNotEmpty({ message: 'Organization ID is required' })
  organizationId!: number;

  @ApiProperty({ example: 'Gokuldham Society', description: 'Name of the site or society' })
  @IsString()
  @IsNotEmpty({ message: 'Site name is required' })
  name!: string;

  @ApiProperty({ example: 'Powai Lake Road' })
  @IsString()
  @IsNotEmpty({ message: 'Address Line 1 is required' })
  addressLine1!: string;

  @ApiProperty({ example: 'Near Hiranandani Gardens', required: false })
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

  @ApiProperty({ example: '400076' })
  @IsString()
  @IsNotEmpty({ message: 'Postal code is required' })
  postalCode!: string;

  @ApiProperty({ example: 'India', default: 'India', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: 19.1197 })
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 72.9051 })
  @IsLongitude()
  longitude!: number;
}
