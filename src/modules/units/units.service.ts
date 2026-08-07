import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all active units with pagination.
   */
  async findAll(paginationDto: PaginationQueryDto, floorId?: number) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(floorId ? { floorId } : {}),
      ...(search ? { unitNumber: { contains: search } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.unit.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          floor: true,
          residents: true,
        },
        orderBy: { unitNumber: 'asc' },
      }),
      this.prismaCore.unit.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single unit by ID.
   */
  async findOne(id: number) {
    const unit = await this.prismaCore.unit.findUnique({
      where: { id },
      include: {
        floor: true,
        residents: true,
      },
    });
    if (!unit || unit.deletedAt) {
      throw new NotFoundException(`Unit with ID ${id} not found.`);
    }
    return unit;
  }

  /**
   * Creates a new unit under a floor.
   */
  async create(dto: CreateUnitDto) {
    const floor = await this.prismaCore.floor.findUnique({
      where: { id: dto.floorId },
    });
    if (!floor) {
      throw new NotFoundException(`Floor with ID ${dto.floorId} not found.`);
    }

    return this.prismaCore.unit.create({
      data: dto,
    });
  }

  /**
   * Updates unit details (unitNumber).
   */
  async update(id: number, dto: UpdateUnitDto) {
    await this.findOne(id);
    return this.prismaCore.unit.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a unit after checking active resident/occupant dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const residentCount = await this.prismaCore.resident.count({
      where: { unitId: id },
    });
    if (residentCount > 0) {
      throw new ConflictException(
        `Cannot delete unit because it is currently assigned to ${residentCount} active resident(s)/occupant(s). Please remove or reassign them first.`,
      );
    }

    return this.prismaCore.unit.delete({
      where: { id },
    });
  }
}
