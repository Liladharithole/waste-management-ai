import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateFloorDto } from './dto/create-floor.dto';
import { UpdateFloorDto } from './dto/update-floor.dto';

@Injectable()
export class FloorsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all active floors, optionally filtered by building ID.
   */
  async findAll(buildingId?: number) {
    return this.prismaCore.floor.findMany({
      where: {
        deletedAt: null,
        ...(buildingId ? { buildingId } : {}),
      },
      include: {
        building: true,
        flats: true,
      },
      orderBy: { floorNumber: 'asc' },
    });
  }

  /**
   * Retrieves a single floor by ID.
   */
  async findOne(id: number) {
    const floor = await this.prismaCore.floor.findUnique({
      where: { id },
      include: {
        building: true,
        flats: true,
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
   * Deletes a floor after checking active flat dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const flatCount = await this.prismaCore.flat.count({
      where: { floorId: id },
    });
    if (flatCount > 0) {
      throw new ConflictException(
        `Cannot delete floor because it currently contains ${flatCount} flat(s). Please remove or reassign these flats first.`,
      );
    }

    return this.prismaCore.floor.delete({
      where: { id },
    });
  }
}
