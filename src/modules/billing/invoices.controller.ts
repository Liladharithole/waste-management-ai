import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BillingService } from './billing.service';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { ApproveInvoiceDto, RejectInvoiceDto } from './dto/approve-invoice.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'Get all invoices with pagination and status filters' })
  @ApiResponse({ status: 200, description: 'Return paginated invoices.' })
  async findAll(@Query() query: InvoiceQueryDto) {
    return this.billingService.findAllInvoices(query);
  }

  @Get(':id')
  @RequirePermissions('invoices:view')
  @ApiOperation({ summary: 'Get invoice receipt details by ID' })
  @ApiResponse({ status: 200, description: 'Return invoice details and line items.' })
  @ApiResponse({ status: 404, description: 'Not Found: Invoice not found.' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.findOneInvoice(id);
  }

  @Post('generate')
  @RequirePermissions('invoices:create')
  @ApiOperation({
    summary:
      'MAKER STEP: Auto-generate a DRAFT invoice based on monthly collection weights and site tariffs',
  })
  @ApiResponse({
    status: 201,
    description: 'Invoice draft generated successfully in DRAFT status.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Missing unitId, siteId, or organizationId.',
  })
  async generateDraft(
    @Body() generateDto: GenerateInvoiceDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.generateInvoiceDraft(generateDto, currentUser?.email);
  }

  @Post(':id/approve')
  @RequirePermissions('invoices:approve')
  @ApiOperation({
    summary:
      'CHECKER STEP: Approve a DRAFT invoice (Transitions status to ISSUED, visible to payer)',
  })
  @ApiResponse({ status: 200, description: 'Invoice approved successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Only DRAFT or REJECTED_DRAFT invoices can be approved.',
  })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @Body() approveDto: ApproveInvoiceDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.approveInvoice(id, currentUser?.email);
  }

  @Post(':id/reject')
  @RequirePermissions('invoices:approve')
  @ApiOperation({ summary: 'CHECKER STEP: Reject a DRAFT invoice with rejection reason' })
  @ApiResponse({ status: 200, description: 'Invoice rejected successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request: Only DRAFT invoices can be rejected.' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() rejectDto: RejectInvoiceDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.rejectInvoice(id, rejectDto.rejectionReason, currentUser?.email);
  }

  @Patch(':id/payment')
  @RequirePermissions('invoices:update')
  @ApiOperation({
    summary:
      'PAYMENT STEP: Record payment details for an ISSUED invoice (Transitions status to PAID)',
  })
  @ApiResponse({ status: 200, description: 'Payment recorded successfully.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Payments can only be recorded for ISSUED or OVERDUE invoices.',
  })
  async recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() paymentDto: RecordPaymentDto,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.recordPayment(id, paymentDto, currentUser?.email);
  }

  @Delete(':id')
  @RequirePermissions('invoices:delete')
  @ApiOperation({ summary: 'Soft-delete an invoice' })
  @ApiResponse({ status: 200, description: 'Invoice soft-deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Not Found: Invoice not found.' })
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: { email?: string },
  ) {
    return this.billingService.deleteInvoice(id, currentUser?.email);
  }
}
