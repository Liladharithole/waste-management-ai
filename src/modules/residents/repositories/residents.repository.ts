import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { CreateResidentDto } from '../dto/create-resident.dto';
import { UpdateResidentDto } from '../dto/update-resident.dto';

@Injectable()
export class ResidentsRepository {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  async findAll(unitId?: number, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(unitId ? { unitId } : {}),
      ...(search
        ? {
            user: {
              OR: [
                { email: { contains: search } },
                { firstName: { contains: search } },
                { lastName: { contains: search } },
              ],
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.resident.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              uuid: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true,
              userProfile: true,
            },
          },
          unit: {
            include: {
              floor: {
                include: {
                  building: {
                    include: {
                      site: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaCore.resident.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prismaCore.resident.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            firstName: true,
            lastName: true,
            status: true,
            userProfile: true,
          },
        },
        unit: {
          include: {
            floor: {
              include: {
                building: {
                  include: {
                    site: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findByUserId(userId: number) {
    return await this.prismaCore.resident.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async findUserById(userId: number) {
    return await this.prismaCore.user.findUnique({
      where: { id: userId },
    });
  }

  async findUnitById(unitId: number) {
    return await this.prismaCore.unit.findUnique({
      where: { id: unitId },
    });
  }

  async create(dto: CreateResidentDto, createdBy?: string) {
    return await this.prismaCore.resident.create({
      data: {
        userId: dto.userId,
        unitId: dto.unitId,
        createdBy: createdBy || 'SYSTEM',
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            status: true,
          },
        },
        unit: true,
      },
    });
  }

  async update(id: number, dto: UpdateResidentDto, updatedBy?: string) {
    return await this.prismaCore.resident.update({
      where: { id },
      data: {
        ...(dto.unitId ? { unitId: dto.unitId } : {}),
        ...(dto.userId ? { userId: dto.userId } : {}),
        updatedBy: updatedBy || 'SYSTEM',
      },
      include: {
        user: {
          select: {
            id: true,
            uuid: true,
            email: true,
            status: true,
          },
        },
        unit: true,
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prismaCore.resident.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
