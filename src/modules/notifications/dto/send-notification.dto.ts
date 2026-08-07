import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: 1, description: 'Target user ID' })
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ example: 'Invoice Overdue Warning', description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({
    example: 'Your invoice #INV-2026-001 is past due by 5 days.',
    description: 'Notification body message',
  })
  @IsString()
  @IsNotEmpty()
  body!: string;

  @ApiProperty({ example: 'INVOICE_OVERDUE', description: 'Notification category type' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Recipient email address' })
  @IsOptional()
  @IsEmail()
  recipientEmail?: string;
}
