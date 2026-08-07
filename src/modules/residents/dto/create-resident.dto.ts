import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class CreateResidentDto {
  @ApiProperty({ example: 1, description: 'ID of the user account' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: number;

  @ApiProperty({ example: 1, description: 'ID of the assigned space unit (flat/office)' })
  @IsInt()
  @Min(1)
  @IsNotEmpty({ message: 'Unit ID is required' })
  unitId!: number;
}
