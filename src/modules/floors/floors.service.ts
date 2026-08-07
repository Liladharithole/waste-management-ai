import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class FloorsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all active floors with pagination.
   */
  async findAll(paginationDto: PaginationQueryDto, buildingId?: number) {
    const { page = 1, limit = 10, search } = paginationDto;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(buildingId ? { buildingId } : {}),
      ...(search ? { name: { contains: search } } : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.floor.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          building: true,
          units: true,
        },
        orderBy: { floorNumber: 'asc' },
      }),
      this.prismaCore.floor.count({ where: whereClause }),
    ]);

    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single floor by ID.
   */
  async findOne(id: number) {
    const floor = await this.prismaCore.floor.findUnique({
      where: { id },
      include: {
        building: true,
        units: true,
      },
    });
    if (!floor || floor.deletedAt) {
      throw new NotFoundException(`Floor with ID ${id} not found.`);
    }
    return floor;
  }

  /**
   * Creates a new floor under a building.
   */
  async create(dto: CreateFloorDto) {
    const building = await this.prismaCore.building.findUnique({
      where: { id: dto.buildingId },
    });
    if (!building) {
      throw new NotFoundException(`Building with ID ${dto.buildingId} not found.`);
    }

    return this.prismaCore.floor.create({
      data: dto,
    });
  }

  /**
   * Updates floor details (floorNumber, name).
   */
  async update(id: number, dto: UpdateFloorDto) {
    await this.findOne(id);
    return this.prismaCore.floor.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a floor after checking active unit dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const unitCount = await this.prismaCore.unit.count({
      where: { floorId: id },
    });
    if (unitCount > 0) {
      throw new ConflictException(
        `Cannot delete floor because it currently contains ${unitCount} unit(s). Please remove or reassign these units first.`,
      );
    }

    return this.prismaCore.floor.delete({
      where: { id },
    });
  }
}
