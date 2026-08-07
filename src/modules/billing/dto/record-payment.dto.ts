import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordPaymentDto {
  @ApiProperty({ example: 'UPI', description: 'Payment method (UPI, NetBanking, Card, Cash)' })
  @IsString()
  @IsNotEmpty({ message: 'Payment method is required' })
  paymentMethod!: string;

  @ApiPropertyOptional({
    example: 'UPI-TXN-9876543210',
    description: 'Transaction or payment reference ID',
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;
}
