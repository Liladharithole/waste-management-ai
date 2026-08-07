import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTariffDto } from '../dto/create-tariff.dto';
import { UpdateTariffDto } from '../dto/update-tariff.dto';
import { TariffQueryDto } from '../dto/tariff-query.dto';

@Injectable()
export class TariffsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: TariffQueryDto) {
    const {
      page = 1,
      limit = 10,
      siteId,
      organizationId,
      wasteCategoryId,
      billingFrequency,
      isActive,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(siteId ? { siteId } : {}),
      ...(organizationId ? { organizationId } : {}),
      ...(wasteCategoryId ? { wasteCategoryId } : {}),
      ...(billingFrequency ? { billingFrequency } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(search ? { OR: [{ name: { contains: search } }] } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteTariff.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: { wasteCategory: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteTariff.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteTariff.findUnique({
      where: { id },
      include: { wasteCategory: true },
    });
  }

  async findActiveTariffsForSiteOrOrg(siteId?: number, organizationId?: number) {
    return await this.prisma.wasteTariff.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        OR: [
          ...(siteId ? [{ siteId }] : []),
          ...(organizationId ? [{ organizationId }] : []),
          { siteId: null, organizationId: null }, // System fallback default
        ],
      },
      include: { wasteCategory: true },
    });
  }

  async create(dto: CreateTariffDto, createdBy?: string) {
    return await this.prisma.wasteTariff.create({
      data: {
        name: dto.name,
        siteId: dto.siteId || null,
        organizationId: dto.organizationId || null,
        wasteCategoryId: dto.wasteCategoryId,
        ratePerKg: dto.ratePerKg,
        baseMonthlyFee: dto.baseMonthlyFee || 0,
        penaltyRatePerKg: dto.penaltyRatePerKg || 0,
        minimumBillAmount: dto.minimumBillAmount || 0,
        isCreditTariff: dto.isCreditTariff !== undefined ? dto.isCreditTariff : false,
        billingFrequency: dto.billingFrequency || 'MONTHLY',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        createdBy: createdBy || 'SYSTEM',
      },
      include: { wasteCategory: true },
    });
  }

  async update(id: number, dto: UpdateTariffDto, updatedBy?: string) {
    return await this.prisma.wasteTariff.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.siteId !== undefined ? { siteId: dto.siteId } : {}),
        ...(dto.organizationId !== undefined ? { organizationId: dto.organizationId } : {}),
        ...(dto.wasteCategoryId !== undefined ? { wasteCategoryId: dto.wasteCategoryId } : {}),
        ...(dto.ratePerKg !== undefined ? { ratePerKg: dto.ratePerKg } : {}),
        ...(dto.baseMonthlyFee !== undefined ? { baseMonthlyFee: dto.baseMonthlyFee } : {}),
        ...(dto.penaltyRatePerKg !== undefined ? { penaltyRatePerKg: dto.penaltyRatePerKg } : {}),
        ...(dto.minimumBillAmount !== undefined
          ? { minimumBillAmount: dto.minimumBillAmount }
          : {}),
        ...(dto.isCreditTariff !== undefined ? { isCreditTariff: dto.isCreditTariff } : {}),
        ...(dto.billingFrequency !== undefined ? { billingFrequency: dto.billingFrequency } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
      include: { wasteCategory: true },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteTariff.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
