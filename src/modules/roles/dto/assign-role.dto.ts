import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignRoleDto {
  @ApiProperty({
    description: 'ID of the user',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty({ message: 'UserId is required' })
  userId!: number;

  @ApiProperty({
    description: 'ID of the role to assign or revoke',
    example: 2,
  })
  @IsInt()
  @IsNotEmpty({ message: 'RoleId is required' })
  roleId!: number;
}
