import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Unique name of the permission (format: resource:action)',
    example: 'users:create',
  })
  @IsString()
  @IsNotEmpty({ message: 'Permission name is required' })
  name!: string;

  @ApiProperty({
    description: 'Optional description of what this permission allows',
    example: 'Allows creation of user accounts',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
