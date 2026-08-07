import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateUnitDto {
  @ApiProperty({ example: 1, description: 'ID of the parent Floor' })
  @IsInt()
  @IsNotEmpty({ message: 'Floor ID is required' })
  floorId!: number;

  @ApiProperty({ example: '302', description: 'Unit number (flat, suite, office number)' })
  @IsString()
  @IsNotEmpty({ message: 'Unit number is required' })
  unitNumber!: string;
}
