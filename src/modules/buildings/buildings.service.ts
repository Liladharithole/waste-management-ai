import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';

@Injectable()
export class BuildingsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all active buildings, optionally filtered by site ID.
   */
  async findAll(siteId?: number) {
    return await this.prismaCore.building.findMany({
      where: {
        deletedAt: null,
        ...(siteId ? { siteId } : {}),
      },
      include: {
        site: true,
        floors: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves a single building by ID.
   */
  async findOne(id: number) {
    const building = await this.prismaCore.building.findUnique({
      where: { id },
      include: {
        site: true,
        floors: true,
      },
    });
    if (!building || building.deletedAt) {
      throw new NotFoundException(`Building with ID ${id} not found.`);
    }
    return building;
  }

  /**
   * Creates a new building under a site.
   */
  async create(dto: CreateBuildingDto) {
    const site = await this.prismaCore.site.findUnique({
      where: { id: dto.siteId },
    });
    if (!site) {
      throw new NotFoundException(`Site with ID ${dto.siteId} not found.`);
    }

    return this.prismaCore.building.create({
      data: dto,
    });
  }

  /**
   * Updates building properties (name, wing).
   */
  async update(id: number, dto: UpdateBuildingDto) {
    await this.findOne(id);
    return this.prismaCore.building.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a building after checking active floor dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const floorCount = await this.prismaCore.floor.count({
      where: { buildingId: id },
    });
    if (floorCount > 0) {
      throw new ConflictException(
        `Cannot delete building because it currently contains ${floorCount} floor(s). Please remove or reassign these floors first.`,
      );
    }

    return this.prismaCore.building.delete({
      where: { id },
    });
  }
}
