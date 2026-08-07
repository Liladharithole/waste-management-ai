import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { TariffsRepository } from './repositories/tariffs.repository';
import { InvoicesRepository } from './repositories/invoices.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateTariffDto } from './dto/create-tariff.dto';
import { UpdateTariffDto } from './dto/update-tariff.dto';
import { TariffQueryDto } from './dto/tariff-query.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { InvoiceQueryDto } from './dto/invoice-query.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { InvoiceStatus, PayerType } from '@prisma/client';

@Injectable()
export class BillingService {
  constructor(
    private readonly tariffsRepository: TariffsRepository,
    private readonly invoicesRepository: InvoicesRepository,
    private readonly wasteCategoriesRepository: WasteCategoriesRepository,
    private readonly prisma: PrismaService,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  // --- TARIFF MANAGEMENT ---

  async findAllTariffs(query: TariffQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { data, total } = await this.tariffsRepository.findAll(query);
    return createPaginatedResponse(data, total, page, limit);
  }

  async findOneTariff(id: number) {
    const tariff = await this.tariffsRepository.findById(id);
    if (!tariff || tariff.deletedAt) {
      throw new NotFoundException(`Tariff configuration with ID ${id} not found.`);
    }
    return tariff;
  }

  async createTariff(dto: CreateTariffDto, createdBy?: string) {
    if (dto.siteId) {
      const site = await this.prismaCore.site.findUnique({ where: { id: dto.siteId } });
      if (!site || site.deletedAt) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
      }
    }

    if (dto.organizationId) {
      const org = await this.prismaCore.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (!org || org.deletedAt) {
        throw new NotFoundException(`Organization with ID ${dto.organizationId} not found.`);
      }
    }

    const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
    }

    return await this.tariffsRepository.create(dto, createdBy);
  }

  async updateTariff(id: number, dto: UpdateTariffDto, updatedBy?: string) {
    await this.findOneTariff(id);

    if (dto.siteId) {
      const site = await this.prismaCore.site.findUnique({ where: { id: dto.siteId } });
      if (!site || site.deletedAt) {
        throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
      }
    }

    if (dto.organizationId) {
      const org = await this.prismaCore.organization.findUnique({
        where: { id: dto.organizationId },
      });
      if (!org || org.deletedAt) {
        throw new NotFoundException(`Organization with ID ${dto.organizationId} not found.`);
      }
    }

    if (dto.wasteCategoryId) {
      const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
      if (!category || category.deletedAt) {
        throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
      }
    }

    return await this.tariffsRepository.update(id, dto, updatedBy);
  }

  async deleteTariff(id: number, deletedBy?: string) {
    await this.findOneTariff(id);
    return await this.tariffsRepository.softDelete(id, deletedBy);
  }

  // --- INVOICE MANAGEMENT (MAKER - CHECKER WORKFLOW) ---

  async findAllInvoices(query: InvoiceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { data, total } = await this.invoicesRepository.findAll(query);
    return createPaginatedResponse(data, total, page, limit);
  }

  async findOneInvoice(id: number) {
    const invoice = await this.invoicesRepository.findById(id);
    if (!invoice || invoice.deletedAt) {
      throw new NotFoundException(`Invoice with ID ${id} not found.`);
    }

    // Fetch daily collection logs for proof verification
    const collections = await this.prisma.wasteCollection.findMany({
      where: {
        deletedAt: null,
        isCollected: true,
        ...(invoice.unitId ? { residentUserId: invoice.residentUserId || undefined } : {}),
      },
      include: { wasteCategory: true },
      orderBy: { collectionDate: 'asc' },
    });

    const dailyBreakdown = collections.map((c) => ({
      collectionId: c.id,
      date: c.collectionDate.toISOString().slice(0, 10),
      wasteCategoryId: c.wasteCategoryId,
      categoryName: c.wasteCategory.name,
      weightKg: c.weight,
      photoUrl: c.photoUrl,
      remarks: c.remarks,
    }));

    return {
      ...invoice,
      dailyBreakdown,
    };
  }

  /**
   * MAKER STEP: Generates a DRAFT invoice based on collection weight logs & configured site tariffs.
   */
  async generateInvoiceDraft(dto: GenerateInvoiceDto, createdBy?: string) {
    // Validate target entity based on PayerType
    if (dto.payerType === PayerType.UNIT && !dto.unitId) {
      throw new BadRequestException('unitId is required when payerType is UNIT.');
    }
    if (dto.payerType === PayerType.SITE && !dto.siteId) {
      throw new BadRequestException('siteId is required when payerType is SITE.');
    }
    if (dto.payerType === PayerType.ORGANIZATION && !dto.organizationId) {
      throw new BadRequestException('organizationId is required when payerType is ORGANIZATION.');
    }

    // Fetch active tariffs for site/org
    const activeTariffs = await this.tariffsRepository.findActiveTariffsForSiteOrOrg(
      dto.siteId,
      dto.organizationId,
    );
    const tariffMap = new Map<number, { ratePerKg: number; isCreditTariff: boolean }>();
    let baseMonthlyFee = 0;
    let minimumBillAmount = 0;

    for (const t of activeTariffs) {
      tariffMap.set(t.wasteCategoryId, {
        ratePerKg: t.ratePerKg,
        isCreditTariff: t.isCreditTariff,
      });
      if (t.baseMonthlyFee > baseMonthlyFee) {
        baseMonthlyFee = t.baseMonthlyFee;
      }
      if (t.minimumBillAmount > minimumBillAmount) {
        minimumBillAmount = t.minimumBillAmount;
      }
    }

    // Default rates fallback if no custom tariff exists
    const defaultRates: Record<string, number> = {
      organic: 5.0,
      recyclable: 2.0,
      electronic: 15.0,
      hazardous: 20.0,
    };

    // Fetch collections for this billing period
    const collections = await this.prisma.wasteCollection.findMany({
      where: {
        deletedAt: null,
        isCollected: true,
        ...(dto.residentUserId ? { residentUserId: dto.residentUserId } : {}),
      },
      include: { wasteCategory: true },
    });

    // Group total weight by waste category
    const categoryTotals = new Map<
      number,
      { categoryId: number; name: string; weightKg: number }
    >();
    for (const c of collections) {
      const catId = c.wasteCategoryId;
      const catName = c.wasteCategory.name;
      if (!categoryTotals.has(catId)) {
        categoryTotals.set(catId, { categoryId: catId, name: catName, weightKg: 0 });
      }
      categoryTotals.get(catId)!.weightKg += c.weight;
    }

    // Calculate line items
    let subtotal = baseMonthlyFee;
    const lineItems: Array<{
      wasteCategoryId: number;
      wasteCategoryName: string;
      totalWeightKg: number;
      ratePerKg: number;
      lineTotal: number;
      isCredit: boolean;
    }> = [];

    for (const entry of categoryTotals.values()) {
      const catNameLower = entry.name.toLowerCase();
      const tariffConfig = tariffMap.get(entry.categoryId);
      let rate = tariffConfig ? tariffConfig.ratePerKg : undefined;
      const isCredit = tariffConfig ? tariffConfig.isCreditTariff : false;

      if (rate === undefined) {
        if (catNameLower.includes('organic') || catNameLower.includes('wet'))
          rate = defaultRates.organic;
        else if (catNameLower.includes('recycle') || catNameLower.includes('dry'))
          rate = defaultRates.recyclable;
        else if (catNameLower.includes('e-waste') || catNameLower.includes('electronic'))
          rate = defaultRates.electronic;
        else rate = 5.0; // Default baseline rate
      }

      // If credit tariff, line total is subtracted as a negative rebate credit
      const rawLineTotal = parseFloat((entry.weightKg * rate).toFixed(2));
      const lineTotal = isCredit ? -1 * rawLineTotal : rawLineTotal;
      subtotal += lineTotal;

      lineItems.push({
        wasteCategoryId: entry.categoryId,
        wasteCategoryName: entry.name,
        totalWeightKg: parseFloat(entry.weightKg.toFixed(2)),
        ratePerKg: rate,
        lineTotal,
        isCredit,
      });
    }

    // Minimum bill threshold adjustment
    let subtotalAmount = parseFloat(subtotal.toFixed(2));
    if (minimumBillAmount > 0 && subtotalAmount < minimumBillAmount) {
      subtotalAmount = minimumBillAmount; // Adjusted up to contract minimum threshold!
    }

    const taxAmount = parseFloat((subtotalAmount * 0.18).toFixed(2)); // 18% GST/Tax
    const totalAmount = parseFloat((subtotalAmount + taxAmount).toFixed(2));

    const invoiceNumber = `INV-${dto.billingMonth.replace('-', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const dueDate = dto.dueDate
      ? new Date(dto.dueDate)
      : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days due date default

    return await this.invoicesRepository.createInvoiceWithItems({
      invoiceNumber,
      payerType: dto.payerType,
      siteId: dto.siteId,
      unitId: dto.unitId,
      organizationId: dto.organizationId,
      residentUserId: dto.residentUserId,
      billingMonth: dto.billingMonth,
      subtotalAmount,
      taxAmount,
      totalAmount,
      dueDate,
      createdBy,
      items: lineItems,
    });
  }

  /**
   * CHECKER STEP: Approves a DRAFT invoice, transitioning status from DRAFT -> ISSUED.
   */
  async approveInvoice(id: number, approvedBy?: string) {
    const invoice = await this.findOneInvoice(id);
    if (invoice.status !== InvoiceStatus.DRAFT && invoice.status !== InvoiceStatus.REJECTED_DRAFT) {
      throw new BadRequestException(
        `Only DRAFT or REJECTED_DRAFT invoices can be approved. Current status: ${invoice.status}`,
      );
    }

    return await this.invoicesRepository.updateStatus(id, InvoiceStatus.ISSUED, {
      approvedBy,
      updatedBy: approvedBy,
    });
  }

  /**
   * CHECKER STEP: Rejects a DRAFT invoice with rejection notes.
   */
  async rejectInvoice(id: number, rejectionReason: string, rejectedBy?: string) {
    const invoice = await this.findOneInvoice(id);
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        `Only DRAFT invoices can be rejected. Current status: ${invoice.status}`,
      );
    }

    return await this.invoicesRepository.updateStatus(id, InvoiceStatus.REJECTED_DRAFT, {
      rejectionReason,
      updatedBy: rejectedBy,
    });
  }

  /**
   * PAYMENT STEP: Records payment for an ISSUED invoice.
   */
  async recordPayment(id: number, dto: RecordPaymentDto, updatedBy?: string) {
    const invoice = await this.findOneInvoice(id);
    if (invoice.status !== InvoiceStatus.ISSUED && invoice.status !== InvoiceStatus.OVERDUE) {
      throw new BadRequestException(
        `Payments can only be recorded for ISSUED or OVERDUE invoices. Current status: ${invoice.status}`,
      );
    }

    return await this.invoicesRepository.recordPayment(
      id,
      dto.paymentMethod,
      dto.transactionRef,
      updatedBy,
    );
  }

  async deleteInvoice(id: number, deletedBy?: string) {
    await this.findOneInvoice(id);
    return await this.invoicesRepository.softDelete(id, deletedBy);
  }
}
