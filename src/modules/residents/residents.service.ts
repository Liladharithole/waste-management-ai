import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ResidentsRepository } from './repositories/residents.repository';
import { CreateResidentDto } from './dto/create-resident.dto';
import { UpdateResidentDto } from './dto/update-resident.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class ResidentsService {
  constructor(private readonly residentsRepository: ResidentsRepository) {}

  /**
   * Retrieves all active resident mappings with pagination.
   */
  async findAll(paginationDto: PaginationQueryDto, unitId?: number) {
    const { page = 1, limit = 10, search } = paginationDto;
    const { data, total } = await this.residentsRepository.findAll(unitId, page, limit, search);
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single resident mapping by ID.
   */
  async findOne(id: number) {
    const resident = await this.residentsRepository.findById(id);
    if (!resident || resident.deletedAt) {
      throw new NotFoundException(`Resident mapping with ID ${id} not found.`);
    }
    return resident;
  }

  /**
   * Creates a new resident mapping connecting a user to a space unit.
   */
  async create(dto: CreateResidentDto, createdBy?: string) {
    // 1. Verify user exists
    const user = await this.residentsRepository.findUserById(dto.userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    // 2. Verify unit exists
    const unit = await this.residentsRepository.findUnitById(dto.unitId);
    if (!unit || unit.deletedAt) {
      throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);
    }

    // 3. Verify user is not already actively assigned as a resident
    const existing = await this.residentsRepository.findByUserId(dto.userId);
    if (existing) {
      throw new ConflictException(
        `User with ID ${dto.userId} is already assigned as a resident to unit ID ${existing.unitId}.`,
      );
    }

    return await this.residentsRepository.create(dto, createdBy);
  }

  /**
   * Updates an existing resident mapping.
   */
  async update(id: number, dto: UpdateResidentDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.unitId) {
      const unit = await this.residentsRepository.findUnitById(dto.unitId);
      if (!unit || unit.deletedAt) {
        throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);
      }
    }

    if (dto.userId) {
      const user = await this.residentsRepository.findUserById(dto.userId);
      if (!user || user.deletedAt) {
        throw new NotFoundException(`User with ID ${dto.userId} not found.`);
      }
    }

    return await this.residentsRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes a resident mapping.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);
    return await this.residentsRepository.softDelete(id, deletedBy);
  }
}
