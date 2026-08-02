import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Unique name of the role (UPPERCASE_SNAKE_CASE)',
    example: 'ORGANIZATION_MEMBER',
  })
  @IsString()
  @IsNotEmpty({ message: 'Role name is required' })
  name!: string;

  @ApiProperty({
    description: 'Description of what this role represents',
    example: 'Standard staff member inside an organization',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
