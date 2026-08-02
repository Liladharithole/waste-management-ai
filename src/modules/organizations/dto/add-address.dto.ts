import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AddAddressDto {
  @ApiProperty({ example: 'HQ Office', required: false })
  @IsString()
  @IsOptional()
  addressLabel?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty({ message: 'Address Line 1 is required' })
  addressLine1!: string;

  @ApiProperty({ example: 'Suite 400', required: false })
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

  @ApiProperty({ example: false, default: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
