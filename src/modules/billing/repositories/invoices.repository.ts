import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { InvoiceStatus } from '@prisma/client';
import { InvoiceQueryDto } from '../dto/invoice-query.dto';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: InvoiceQueryDto) {
    const {
      page = 1,
      limit = 10,
      status,
      payerType,
      siteId,
      unitId,
      organizationId,
      billingMonth,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(status ? { status } : {}),
      ...(payerType ? { payerType } : {}),
      ...(siteId ? { siteId } : {}),
      ...(unitId ? { unitId } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(billingMonth ? { billingMonth } : {}),
      ...(search ? { OR: [{ invoiceNumber: { contains: search } }] } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteInvoice.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          items: {
            include: { wasteCategory: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteInvoice.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteInvoice.findUnique({
      where: { id },
      include: {
        items: {
          include: { wasteCategory: true },
        },
      },
    });
  }

  async findByInvoiceNumber(invoiceNumber: string) {
    return await this.prisma.wasteInvoice.findUnique({
      where: { invoiceNumber },
      include: {
        items: {
          include: { wasteCategory: true },
        },
      },
    });
  }

  async createInvoiceWithItems(data: {
    invoiceNumber: string;
    payerType: any;
    siteId?: number;
    unitId?: number;
    organizationId?: number;
    residentUserId?: number;
    billingMonth: string;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    dueDate: Date;
    createdBy?: string;
    items: Array<{
      wasteCategoryId: number;
      wasteCategoryName: string;
      totalWeightKg: number;
      ratePerKg: number;
      lineTotal: number;
      isCredit?: boolean;
    }>;
  }) {
    return await this.prisma.wasteInvoice.create({
      data: {
        invoiceNumber: data.invoiceNumber,
        payerType: data.payerType,
        siteId: data.siteId || null,
        unitId: data.unitId || null,
        organizationId: data.organizationId || null,
        residentUserId: data.residentUserId || null,
        billingMonth: data.billingMonth,
        subtotalAmount: data.subtotalAmount,
        taxAmount: data.taxAmount,
        totalAmount: data.totalAmount,
        status: InvoiceStatus.DRAFT,
        dueDate: data.dueDate,
        createdBy: data.createdBy || 'SYSTEM',
        items: {
          create: data.items.map((item) => ({
            wasteCategoryId: item.wasteCategoryId,
            wasteCategoryName: item.wasteCategoryName,
            totalWeightKg: item.totalWeightKg,
            ratePerKg: item.ratePerKg,
            lineTotal: item.lineTotal,
            isCredit: item.isCredit || false,
          })),
        },
      },
      include: {
        items: {
          include: { wasteCategory: true },
        },
      },
    });
  }

  async updateStatus(
    id: number,
    status: InvoiceStatus,
    auditData?: { approvedBy?: string; rejectionReason?: string; updatedBy?: string },
  ) {
    return await this.prisma.wasteInvoice.update({
      where: { id },
      data: {
        status,
        ...(auditData?.approvedBy
          ? { approvedBy: auditData.approvedBy, approvedAt: new Date() }
          : {}),
        ...(auditData?.rejectionReason ? { rejectionReason: auditData.rejectionReason } : {}),
        updatedBy: auditData?.updatedBy || 'SYSTEM',
      },
      include: {
        items: {
          include: { wasteCategory: true },
        },
      },
    });
  }

  async recordPayment(
    id: number,
    paymentMethod: string,
    transactionRef?: string,
    updatedBy?: string,
  ) {
    return await this.prisma.wasteInvoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paymentMethod,
        transactionRef: transactionRef || null,
        paidAt: new Date(),
        updatedBy: updatedBy || 'SYSTEM',
      },
      include: {
        items: {
          include: { wasteCategory: true },
        },
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteInvoice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
