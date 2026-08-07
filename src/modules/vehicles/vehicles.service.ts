import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleQueryDto } from './dto/vehicle-query.dto';
import { ComplianceService } from '../compliance/compliance.service';
import { ComplianceEntityType } from '@prisma/client-central-core';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly complianceService: ComplianceService,
  ) {}

  async createVehicle(dto: CreateVehicleDto, auditUser?: string) {
    const existing = await this.vehiclesRepo.findByRegistrationNumber(dto.registrationNumber);
    if (existing) {
      throw new ConflictException(
        `Vehicle with registration number '${dto.registrationNumber}' already exists.`,
      );
    }
    return await this.vehiclesRepo.create(dto, auditUser);
  }

  async findAll(query: VehicleQueryDto) {
    return await this.vehiclesRepo.findAll(query);
  }

  async findOne(id: number) {
    const vehicle = await this.vehiclesRepo.findById(id);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found.`);
    }

    const complianceDocs = await this.complianceService.findAll({
      entityType: ComplianceEntityType.VEHICLE,
      entityId: id,
      page: 1,
      limit: 100,
    });

    return {
      ...vehicle,
      complianceDocuments: complianceDocs.data,
    };
  }

  async updateVehicle(id: number, dto: UpdateVehicleDto, auditUser?: string) {
    await this.findOne(id);
    if (dto.registrationNumber) {
      const existing = await this.vehiclesRepo.findByRegistrationNumber(dto.registrationNumber);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Vehicle registration '${dto.registrationNumber}' is already in use by vehicle ID ${existing.id}.`,
        );
      }
    }
    return await this.vehiclesRepo.update(id, dto, auditUser);
  }

  async removeVehicle(id: number, auditUser?: string) {
    await this.findOne(id);
    return await this.vehiclesRepo.softDelete(id, auditUser);
  }
}
