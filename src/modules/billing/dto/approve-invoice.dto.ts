import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ApproveInvoiceDto {
  @ApiPropertyOptional({
    example: 'Audited line items against photo logs. Approved.',
    description: 'Optional approval notes',
  })
  @IsOptional()
  @IsString()
  approvalNotes?: string;
}

export class RejectInvoiceDto {
  @ApiPropertyOptional({
    example: 'Weight logged on Aug 5 appears duplicated. Please recalculate.',
    description: 'Reason for rejection',
  })
  @IsString()
  rejectionReason!: string;
}
