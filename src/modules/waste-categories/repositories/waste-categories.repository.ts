import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateWasteCategoryDto } from '../dto/create-waste-category.dto';
import { UpdateWasteCategoryDto } from '../dto/update-waste-category.dto';

@Injectable()
export class WasteCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(search
        ? {
            OR: [{ name: { contains: search } }, { description: { contains: search } }],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteCategory.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.wasteCategory.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prisma.wasteCategory.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return await this.prisma.wasteCategory.findFirst({
      where: {
        name,
        deletedAt: null,
      },
    });
  }

  async create(dto: CreateWasteCategoryDto, createdBy?: string) {
    return await this.prisma.wasteCategory.create({
      data: {
        name: dto.name,
        description: dto.description || null,
        createdBy: createdBy || 'SYSTEM',
      },
    });
  }

  async update(id: number, dto: UpdateWasteCategoryDto, updatedBy?: string) {
    return await this.prisma.wasteCategory.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prisma.wasteCategory.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }

  async countLinkedCollections(categoryId: number) {
    return await this.prisma.wasteCollection.count({
      where: {
        wasteCategoryId: categoryId,
        deletedAt: null,
      },
    });
  }
}
