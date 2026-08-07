import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { WasteCategoriesRepository } from './repositories/waste-categories.repository';
import { CreateWasteCategoryDto } from './dto/create-waste-category.dto';
import { UpdateWasteCategoryDto } from './dto/update-waste-category.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class WasteCategoriesService {
  constructor(private readonly wasteCategoriesRepository: WasteCategoriesRepository) {}

  /**
   * Retrieves all active waste categories with pagination.
   */
  async findAll(paginationDto: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = paginationDto;
    const { data, total } = await this.wasteCategoriesRepository.findAll(page, limit, search);
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single waste category by ID.
   */
  async findOne(id: number) {
    const category = await this.wasteCategoriesRepository.findById(id);
    if (!category || category.deletedAt) {
      throw new NotFoundException(`Waste category with ID ${id} not found.`);
    }
    return category;
  }

  /**
   * Creates a new waste category.
   */
  async create(dto: CreateWasteCategoryDto, createdBy?: string) {
    const existing = await this.wasteCategoriesRepository.findByName(dto.name);
    if (existing) {
      throw new ConflictException(`Waste category with name '${dto.name}' already exists.`);
    }
    return await this.wasteCategoriesRepository.create(dto, createdBy);
  }

  /**
   * Updates an existing waste category.
   */
  async update(id: number, dto: UpdateWasteCategoryDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.name) {
      const existing = await this.wasteCategoriesRepository.findByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException(`Waste category with name '${dto.name}' already exists.`);
      }
    }

    return await this.wasteCategoriesRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes a waste category after checking linked collection logs.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);

    const linkedCollectionsCount = await this.wasteCategoriesRepository.countLinkedCollections(id);
    if (linkedCollectionsCount > 0) {
      throw new ConflictException(
        `Cannot delete waste category because it is linked to ${linkedCollectionsCount} active collection record(s).`,
      );
    }

    return await this.wasteCategoriesRepository.softDelete(id, deletedBy);
  }
}
