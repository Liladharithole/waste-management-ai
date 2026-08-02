import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty } from 'class-validator';

export class AssignPermissionDto {
  @ApiProperty({
    description: 'ID of the role',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty({ message: 'RoleId is required' })
  roleId!: number;

  @ApiProperty({
    description: 'ID of the permission to assign or revoke',
    example: 5,
  })
  @IsInt()
  @IsNotEmpty({ message: 'PermissionId is required' })
  permissionId!: number;
}
