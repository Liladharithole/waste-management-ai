import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateFlatDto } from './dto/create-flat.dto';
import { UpdateFlatDto } from './dto/update-flat.dto';

@Injectable()
export class FlatsService {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  /**
   * Retrieves all active flats, optionally filtered by floor ID.
   */
  async findAll(floorId?: number) {
    return await this.prismaCore.flat.findMany({
      where: {
        deletedAt: null,
        ...(floorId ? { floorId } : {}),
      },
      include: {
        floor: true,
        residents: true,
      },
      orderBy: { flatNumber: 'asc' },
    });
  }

  /**
   * Retrieves a single flat by ID.
   */
  async findOne(id: number) {
    const flat = await this.prismaCore.flat.findUnique({
      where: { id },
      include: {
        floor: true,
        residents: true,
      },
    });
    if (!flat || flat.deletedAt) {
      throw new NotFoundException(`Flat with ID ${id} not found.`);
    }
    return flat;
  }

  /**
   * Creates a new flat under a floor.
   */
  async create(dto: CreateFlatDto) {
    const floor = await this.prismaCore.floor.findUnique({
      where: { id: dto.floorId },
    });
    if (!floor) {
      throw new NotFoundException(`Floor with ID ${dto.floorId} not found.`);
    }

    return this.prismaCore.flat.create({
      data: dto,
    });
  }

  /**
   * Updates flat details (flatNumber).
   */
  async update(id: number, dto: UpdateFlatDto) {
    await this.findOne(id);
    return this.prismaCore.flat.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a flat after checking active resident dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const residentCount = await this.prismaCore.resident.count({
      where: { flatId: id },
    });
    if (residentCount > 0) {
      throw new ConflictException(
        `Cannot delete flat because it is currently assigned to ${residentCount} active resident(s). Please remove or reassign these residents first.`,
      );
    }

    return this.prismaCore.flat.delete({
      where: { id },
    });
  }
}
