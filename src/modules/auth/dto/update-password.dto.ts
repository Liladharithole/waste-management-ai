import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'OldSecurePassword123',
  })
  @IsString()
  @IsNotEmpty({ message: 'Old password is required' })
  oldPassword!: string;

  @ApiProperty({
    description: 'New password for the account',
    example: 'NewSecurePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(6, { message: 'New password must be at least 6 characters' })
  newPassword!: string;
}
