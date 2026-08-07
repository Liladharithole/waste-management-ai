import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplaintsRepository } from './repositories/complaints.repository';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { ComplaintQueryDto } from './dto/complaint-query.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import * as crypto from 'crypto';

@Injectable()
export class ComplaintsService {
  constructor(
    private readonly complaintsRepository: ComplaintsRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  /**
   * Generates a unique complaint ticket number (e.g., CMP-20260808-A1B2).
   */
  private generateComplaintNumber(): string {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `CMP-${today}-${randomSuffix}`;
  }

  /**
   * Retrieves paginated complaints with multi-field filtering.
   */
  async findAll(query: ComplaintQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const { data, total } = await this.complaintsRepository.findAll(query);
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single complaint by ID.
   */
  async findOne(id: number) {
    const complaint = await this.complaintsRepository.findById(id);
    if (!complaint || complaint.deletedAt) {
      throw new NotFoundException(`Complaint with ID ${id} not found.`);
    }
    return complaint;
  }

  /**
   * Files a new complaint.
   */
  async create(dto: CreateComplaintDto, createdBy?: string) {
    // 1. Cross-DB validation: Check resident user exists in central_core_db
    const residentUser = await this.prismaCore.user.findUnique({
      where: { id: dto.residentUserId },
    });
    if (!residentUser || residentUser.deletedAt) {
      throw new NotFoundException(`Resident user with ID ${dto.residentUserId} not found.`);
    }

    // 2. Cross-DB validation: If unitId provided, check unit exists in central_core_db
    if (dto.unitId) {
      const unit = await this.prismaCore.unit.findUnique({
        where: { id: dto.unitId },
      });
      if (!unit || unit.deletedAt) {
        throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);
      }
    }

    const complaintNumber = this.generateComplaintNumber();
    return await this.complaintsRepository.create(dto, complaintNumber, createdBy);
  }

  /**
   * Updates an existing complaint (status change, employee assignment, resolution notes).
   */
  async update(id: number, dto: UpdateComplaintDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.residentUserId) {
      const residentUser = await this.prismaCore.user.findUnique({
        where: { id: dto.residentUserId },
      });
      if (!residentUser || residentUser.deletedAt) {
        throw new NotFoundException(`Resident user with ID ${dto.residentUserId} not found.`);
      }
    }

    if (dto.assignedEmployeeId) {
      const employeeUser = await this.prismaCore.user.findUnique({
        where: { id: dto.assignedEmployeeId },
      });
      if (!employeeUser || employeeUser.deletedAt) {
        throw new NotFoundException(
          `Assigned employee user with ID ${dto.assignedEmployeeId} not found.`,
        );
      }
    }

    if (dto.unitId) {
      const unit = await this.prismaCore.unit.findUnique({
        where: { id: dto.unitId },
      });
      if (!unit || unit.deletedAt) {
        throw new NotFoundException(`Unit with ID ${dto.unitId} not found.`);
      }
    }

    return await this.complaintsRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes a complaint record.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);
    return await this.complaintsRepository.softDelete(id, deletedBy);
  }
}
