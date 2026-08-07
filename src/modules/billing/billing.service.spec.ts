import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from './billing.service';
import { TariffsRepository } from './repositories/tariffs.repository';
import { InvoicesRepository } from './repositories/invoices.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { InvoiceStatus, PayerType } from '@prisma/client';

describe('BillingService', () => {
  let service: BillingService;

  const mockTariffsRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findActiveTariffsForSiteOrOrg: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockInvoicesRepo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByInvoiceNumber: jest.fn(),
    createInvoiceWithItems: jest.fn(),
    updateStatus: jest.fn(),
    recordPayment: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockCategoriesRepo = {
    findById: jest.fn(),
  };

  const mockPrisma = {
    wasteCollection: {
      findMany: jest.fn(),
    },
  };

  const mockPrismaCore = {
    site: {
      findUnique: jest.fn(),
    },
    organization: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        { provide: TariffsRepository, useValue: mockTariffsRepo },
        { provide: InvoicesRepository, useValue: mockInvoicesRepo },
        { provide: WasteCategoriesRepository, useValue: mockCategoriesRepo },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PrismaCentralCoreService, useValue: mockPrismaCore },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);

    jest.clearAllMocks();
  });

  describe('Tariffs Management', () => {
    it('should create a new tariff when cross-DB relations exist', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue({ id: 1 });
      mockCategoriesRepo.findById.mockResolvedValue({ id: 1, name: 'Organic' });
      mockTariffsRepo.create.mockResolvedValue({ id: 10, name: 'Site 1 Tariff', ratePerKg: 5.0 });

      const dto = {
        name: 'Site 1 Tariff',
        siteId: 1,
        wasteCategoryId: 1,
        ratePerKg: 5.0,
      };

      const result = await service.createTariff(dto, 'admin@example.com');

      expect(result).toHaveProperty('id', 10);
      expect(mockTariffsRepo.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if site not found during tariff creation', async () => {
      mockPrismaCore.site.findUnique.mockResolvedValue(null);

      const dto = {
        name: 'Site 1 Tariff',
        siteId: 999,
        wasteCategoryId: 1,
        ratePerKg: 5.0,
      };

      await expect(service.createTariff(dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('Maker Step: generateInvoiceDraft', () => {
    it('should calculate weights, apply tariffs, add tax, and save invoice in DRAFT status', async () => {
      mockTariffsRepo.findActiveTariffsForSiteOrOrg.mockResolvedValue([
        { wasteCategoryId: 1, ratePerKg: 5.0, baseMonthlyFee: 200.0 }, // Organic
        { wasteCategoryId: 2, ratePerKg: 2.0, baseMonthlyFee: 0.0 }, // Recyclable
      ]);

      mockPrisma.wasteCollection.findMany.mockResolvedValue([
        { id: 1, weight: 10.0, wasteCategoryId: 1, wasteCategory: { name: 'Organic' } },
        { id: 2, weight: 20.0, wasteCategoryId: 2, wasteCategory: { name: 'Recyclable' } },
      ]);

      mockInvoicesRepo.createInvoiceWithItems.mockImplementation((data) =>
        Promise.resolve({ id: 100, ...data, status: InvoiceStatus.DRAFT }),
      );

      const dto = {
        payerType: PayerType.UNIT,
        unitId: 5,
        siteId: 1,
        billingMonth: '2026-08',
      };

      const result = await service.generateInvoiceDraft(dto, 'maker@example.com');

      // Subtotal = 200 (base fee) + (10kg * 5.0 = 50) + (20kg * 2.0 = 40) = 290.00
      // Tax (18%) = 290 * 0.18 = 52.20
      // Total = 342.20
      expect(result).toHaveProperty('id', 100);
      expect(result.status).toBe(InvoiceStatus.DRAFT);
      expect(result.subtotalAmount).toBe(290);
      expect(result.taxAmount).toBe(52.2);
      expect(result.totalAmount).toBe(342.2);
      expect(result.items).toHaveLength(2);
    });

    it('REAL-WORLD EDGE CASE: should subtract recycling credits and enforce contract minimum bill threshold', async () => {
      mockTariffsRepo.findActiveTariffsForSiteOrOrg.mockResolvedValue([
        {
          wasteCategoryId: 1,
          ratePerKg: 10.0,
          baseMonthlyFee: 0.0,
          minimumBillAmount: 500.0,
          isCreditTariff: false,
        }, // Organic
        {
          wasteCategoryId: 2,
          ratePerKg: 4.0,
          baseMonthlyFee: 0.0,
          minimumBillAmount: 500.0,
          isCreditTariff: true,
        }, // Recyclable (CREDIT REBATE!)
      ]);

      mockPrisma.wasteCollection.findMany.mockResolvedValue([
        { id: 1, weight: 30.0, wasteCategoryId: 1, wasteCategory: { name: 'Organic' } }, // +300.00
        { id: 2, weight: 50.0, wasteCategoryId: 2, wasteCategory: { name: 'Recyclable' } }, // -200.00 credit!
      ]);

      mockInvoicesRepo.createInvoiceWithItems.mockImplementation((data) =>
        Promise.resolve({ id: 101, ...data, status: InvoiceStatus.DRAFT }),
      );

      const dto = {
        payerType: PayerType.ORGANIZATION,
        organizationId: 2,
        billingMonth: '2026-08',
      };

      const result = await service.generateInvoiceDraft(dto, 'maker@example.com');

      // Calculated Subtotal = 300 - 200 = 100.00
      // Minimum Bill Threshold = 500.00
      // Adjusted Subtotal = 500.00
      // Tax (18%) = 500 * 0.18 = 90.00
      // Total Amount = 590.00
      expect(result.subtotalAmount).toBe(500);
      expect(result.taxAmount).toBe(90);
      expect(result.totalAmount).toBe(590);
      expect(result.items[1].isCredit).toBe(true);
      expect(result.items[1].lineTotal).toBe(-200);
    });

    it('should throw BadRequestException if unitId missing when payerType is UNIT', async () => {
      const dto = {
        payerType: PayerType.UNIT,
        billingMonth: '2026-08',
      };

      await expect(service.generateInvoiceDraft(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOneInvoice', () => {
    it('should return invoice details enriched with dailyBreakdown collection proof', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({
        id: 100,
        invoiceNumber: 'INV-100',
        status: InvoiceStatus.ISSUED,
      });
      mockPrisma.wasteCollection.findMany.mockResolvedValue([
        {
          id: 1,
          collectionDate: new Date('2026-08-01T10:00:00Z'),
          weight: 15.0,
          wasteCategoryId: 1,
          wasteCategory: { name: 'Organic' },
          photoUrl: 'https://cdn.example.com/proof1.jpg',
          remarks: 'Clean pickup',
        },
      ]);

      const result = await service.findOneInvoice(100);

      expect(result).toHaveProperty('id', 100);
      expect(result).toHaveProperty('dailyBreakdown');
      expect(result.dailyBreakdown).toHaveLength(1);
      expect(result.dailyBreakdown[0].categoryName).toBe('Organic');
      expect(result.dailyBreakdown[0].photoUrl).toBe('https://cdn.example.com/proof1.jpg');
    });
  });

  describe('Checker Step: approveInvoice & rejectInvoice', () => {
    it('should approve DRAFT invoice and transition to ISSUED', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({ id: 100, status: InvoiceStatus.DRAFT });
      mockInvoicesRepo.updateStatus.mockResolvedValue({
        id: 100,
        status: InvoiceStatus.ISSUED,
        approvedBy: 'checker@example.com',
      });

      const result = await service.approveInvoice(100, 'checker@example.com');

      expect(result.status).toBe(InvoiceStatus.ISSUED);
      expect(mockInvoicesRepo.updateStatus).toHaveBeenCalledWith(
        100,
        InvoiceStatus.ISSUED,
        expect.any(Object),
      );
    });

    it('REAL-WORLD EDGE CASE: should throw BadRequestException when trying to approve an invoice that is already ISSUED or PAID', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({ id: 100, status: InvoiceStatus.PAID });

      await expect(service.approveInvoice(100, 'checker@example.com')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reject DRAFT invoice with rejection notes', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({ id: 100, status: InvoiceStatus.DRAFT });
      mockInvoicesRepo.updateStatus.mockResolvedValue({
        id: 100,
        status: InvoiceStatus.REJECTED_DRAFT,
        rejectionReason: 'Duplicate weight',
      });

      const result = await service.rejectInvoice(100, 'Duplicate weight', 'checker@example.com');

      expect(result.status).toBe(InvoiceStatus.REJECTED_DRAFT);
    });
  });

  describe('Payment Step: recordPayment', () => {
    it('should record payment for ISSUED invoice and set status to PAID', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({ id: 100, status: InvoiceStatus.ISSUED });
      mockInvoicesRepo.recordPayment.mockResolvedValue({
        id: 100,
        status: InvoiceStatus.PAID,
        paymentMethod: 'UPI',
      });

      const result = await service.recordPayment(
        100,
        { paymentMethod: 'UPI', transactionRef: 'TXN123' },
        'payer@example.com',
      );

      expect(result.status).toBe(InvoiceStatus.PAID);
    });

    it('REAL-WORLD EDGE CASE: should throw BadRequestException if trying to record payment on a DRAFT invoice', async () => {
      mockInvoicesRepo.findById.mockResolvedValue({ id: 100, status: InvoiceStatus.DRAFT });

      await expect(service.recordPayment(100, { paymentMethod: 'UPI' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
