import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehicleQueryDto } from '../dto/vehicle-query.dto';
import { ComplianceStatus, VehicleStatus } from '@prisma/client';

@Injectable()
export class VehiclesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVehicleDto, auditUser?: string) {
    return await this.prisma.wasteVehicle.create({
      data: {
        organizationId: dto.organizationId,
        registrationNumber: dto.registrationNumber,
        vehicleType: dto.vehicleType,
        capacityMetricTons: dto.capacityMetricTons,
        status: dto.status || VehicleStatus.ACTIVE,
        complianceStatus: ComplianceStatus.COMPLIANT,
        fuelType: dto.fuelType || 'DIESEL',
        createdBy: auditUser,
      },
    });
  }

  async findAll(query: VehicleQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.vehicleType ? { vehicleType: query.vehicleType } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.complianceStatus ? { complianceStatus: query.complianceStatus } : {}),
      ...(query.registrationNumber
        ? { registrationNumber: { contains: query.registrationNumber } }
        : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.wasteVehicle.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.wasteVehicle.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: number) {
    return await this.prisma.wasteVehicle.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async findByRegistrationNumber(registrationNumber: string) {
    return await this.prisma.wasteVehicle.findFirst({
      where: { registrationNumber, deletedAt: null },
    });
  }

  async update(id: number, dto: UpdateVehicleDto, auditUser?: string) {
    return await this.prisma.wasteVehicle.update({
      where: { id },
      data: {
        ...dto,
        updatedBy: auditUser,
      },
    });
  }

  async updateComplianceStatus(id: number, complianceStatus: ComplianceStatus, auditUser?: string) {
    return await this.prisma.wasteVehicle.update({
      where: { id },
      data: {
        complianceStatus,
        updatedBy: auditUser,
      },
    });
  }

  async softDelete(id: number, auditUser?: string) {
    return await this.prisma.wasteVehicle.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: auditUser,
      },
    });
  }
}
