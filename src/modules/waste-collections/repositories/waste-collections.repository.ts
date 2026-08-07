import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateWasteCollectionDto } from '../dto/create-waste-collection.dto';
import { UpdateWasteCollectionDto } from '../dto/update-waste-collection.dto';
import { WasteCollectionQueryDto } from '../dto/waste-collection-query.dto';

@Injectable()
export class WasteCollectionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WasteCollectionQueryDto) {
    const {
      page = 1,
      limit = 10,
      collectorUserId,
      residentUserId,
      wasteCategoryId,
      startDate,
      endDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(collectorUserId ? { collectorUserId } : {}),
      ...(residentUserId ? { residentUserId } : {}),
      ...(wasteCategoryId ? { wasteCategoryId } : {}),
      ...(startDate || endDate
        ? {
            collectionDate: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
      ...(search
        ? {
            OR: [{ remarks: { contains: search } }],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteCollection.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          wasteCategory: true,
        },
        orderBy: { collectionDate: 'desc' },
      }),
      this.prisma.wasteCollection.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteCollection.findUnique({
      where: { id },
      include: {
        wasteCategory: true,
      },
    });
  }

  async create(dto: CreateWasteCollectionDto, createdBy?: string) {
    return await this.prisma.wasteCollection.create({
      data: {
        collectorUserId: dto.collectorUserId,
        residentUserId: dto.residentUserId,
        wasteCategoryId: dto.wasteCategoryId,
        weight: dto.weight,
        photoUrl: dto.photoUrl || null,
        remarks: dto.remarks || null,
        isCollected: dto.isCollected !== undefined ? dto.isCollected : true,
        createdBy: createdBy || 'SYSTEM',
      },
      include: {
        wasteCategory: true,
      },
    });
  }

  async update(id: number, dto: UpdateWasteCollectionDto, updatedBy?: string) {
    return await this.prisma.wasteCollection.update({
      where: { id },
      data: {
        ...(dto.collectorUserId ? { collectorUserId: dto.collectorUserId } : {}),
        ...(dto.residentUserId ? { residentUserId: dto.residentUserId } : {}),
        ...(dto.wasteCategoryId ? { wasteCategoryId: dto.wasteCategoryId } : {}),
        ...(dto.weight !== undefined ? { weight: dto.weight } : {}),
        ...(dto.photoUrl !== undefined ? { photoUrl: dto.photoUrl } : {}),
        ...(dto.remarks !== undefined ? { remarks: dto.remarks } : {}),
        ...(dto.isCollected !== undefined ? { isCollected: dto.isCollected } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
      include: {
        wasteCategory: true,
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteCollection.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
