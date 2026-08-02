import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateFlatDto {
  @ApiProperty({ example: 1, description: 'ID of the parent Floor' })
  @IsInt()
  @IsNotEmpty({ message: 'Floor ID is required' })
  floorId!: number;

  @ApiProperty({ example: '302', description: 'Flat or unit number' })
  @IsString()
  @IsNotEmpty({ message: 'Flat number is required' })
  flatNumber!: string;
}
