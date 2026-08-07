import { Injectable, NotFoundException } from '@nestjs/common';
import { WasteCollectionsRepository } from './repositories/waste-collections.repository';
import { WasteCategoriesRepository } from '../waste-categories/repositories/waste-categories.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateWasteCollectionDto } from './dto/create-waste-collection.dto';
import { UpdateWasteCollectionDto } from './dto/update-waste-collection.dto';
import { WasteCollectionQueryDto } from './dto/waste-collection-query.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';

@Injectable()
export class WasteCollectionsService {
  constructor(
    private readonly wasteCollectionsRepository: WasteCollectionsRepository,
    private readonly wasteCategoriesRepository: WasteCategoriesRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  /**
   * Retrieves all waste collection records with pagination and multi-field filtering.
   */
  async findAll(query: WasteCollectionQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { data, total } = await this.wasteCollectionsRepository.findAll(query);
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single waste collection record by ID.
   */
  async findOne(id: number) {
    const collection = await this.wasteCollectionsRepository.findById(id);
    if (!collection || collection.deletedAt) {
      throw new NotFoundException(`Waste collection log with ID ${id} not found.`);
    }
    return collection;
  }

  /**
   * Records a new waste collection transaction.
   */
  async create(dto: CreateWasteCollectionDto, createdBy?: string) {
    // 1. Cross-DB validation: Check collector user exists in central_core_db
    const collectorUser = await this.prismaCore.user.findUnique({
      where: { id: dto.collectorUserId },
    });
    if (!collectorUser || collectorUser.deletedAt) {
      throw new NotFoundException(`Collector user with ID ${dto.collectorUserId} not found.`);
    }

    // 2. Cross-DB validation: Check resident user exists in central_core_db
    const residentUser = await this.prismaCore.user.findUnique({
      where: { id: dto.residentUserId },
    });
    if (!residentUser || residentUser.deletedAt) {
      throw new NotFoundException(`Resident user with ID ${dto.residentUserId} not found.`);
    }

    // 3. Same-DB validation: Check waste category exists in waste_management DB
    const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
    }

    return await this.wasteCollectionsRepository.create(dto, createdBy);
  }

  /**
   * Updates an existing waste collection record.
   */
  async update(id: number, dto: UpdateWasteCollectionDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.collectorUserId) {
      const collectorUser = await this.prismaCore.user.findUnique({
        where: { id: dto.collectorUserId },
      });
      if (!collectorUser || collectorUser.deletedAt) {
        throw new NotFoundException(`Collector user with ID ${dto.collectorUserId} not found.`);
      }
    }

    if (dto.residentUserId) {
      const residentUser = await this.prismaCore.user.findUnique({
        where: { id: dto.residentUserId },
      });
      if (!residentUser || residentUser.deletedAt) {
        throw new NotFoundException(`Resident user with ID ${dto.residentUserId} not found.`);
      }
    }

    if (dto.wasteCategoryId) {
      const category = await this.wasteCategoriesRepository.findById(dto.wasteCategoryId);
      if (!category || category.deletedAt) {
        throw new NotFoundException(`Waste category with ID ${dto.wasteCategoryId} not found.`);
      }
    }

    return await this.wasteCollectionsRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes a waste collection record.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);
    return await this.wasteCollectionsRepository.softDelete(id, deletedBy);
  }
}
