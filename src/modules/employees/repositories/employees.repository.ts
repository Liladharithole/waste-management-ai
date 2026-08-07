import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';

@Injectable()
export class EmployeesRepository {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  async findAll(organizationId?: number, page: number = 1, limit: number = 10, search?: string) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(organizationId ? { organizationId } : {}),
      ...(search
        ? {
            OR: [
              { employeeCode: { contains: search } },
              { designation: { contains: search } },
              {
                user: {
                  OR: [
                    { email: { contains: search } },
                    { firstName: { contains: search } },
                    { lastName: { contains: search } },
                  ],
                },
              },
            ],
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.employee.findMany({
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
          organization: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaCore.employee.count({ where: whereClause }),
    ]);

    return { data, total };
  }

  async findById(id: number) {
    return await this.prismaCore.employee.findUnique({
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
        organization: true,
      },
    });
  }

  async findByUserId(userId: number) {
    return await this.prismaCore.employee.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });
  }

  async findByEmployeeCode(employeeCode: string) {
    return await this.prismaCore.employee.findFirst({
      where: {
        employeeCode,
        deletedAt: null,
      },
    });
  }

  async findUserById(userId: number) {
    return await this.prismaCore.user.findUnique({
      where: { id: userId },
    });
  }

  async findOrganizationById(organizationId: number) {
    return await this.prismaCore.organization.findUnique({
      where: { id: organizationId },
    });
  }

  async create(dto: CreateEmployeeDto, createdBy?: string) {
    return await this.prismaCore.employee.create({
      data: {
        userId: dto.userId,
        organizationId: dto.organizationId,
        employeeCode: dto.employeeCode || null,
        designation: dto.designation || null,
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
        organization: true,
      },
    });
  }

  async update(id: number, dto: UpdateEmployeeDto, updatedBy?: string) {
    return await this.prismaCore.employee.update({
      where: { id },
      data: {
        ...(dto.organizationId ? { organizationId: dto.organizationId } : {}),
        ...(dto.userId ? { userId: dto.userId } : {}),
        ...(dto.employeeCode !== undefined ? { employeeCode: dto.employeeCode } : {}),
        ...(dto.designation !== undefined ? { designation: dto.designation } : {}),
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
        organization: true,
      },
    });
  }

  async softDelete(id: number, deletedBy?: string) {
    return await this.prismaCore.employee.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: deletedBy || 'SYSTEM',
      },
    });
  }
}
