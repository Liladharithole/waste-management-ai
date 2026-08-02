import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'New unique name of the role',
    example: 'MEMBER',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'New description of the role',
    example: 'Updated staff role',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
