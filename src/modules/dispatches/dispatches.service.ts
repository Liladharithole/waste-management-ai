import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DispatchesRepository } from './repositories/dispatches.repository';
import { VehiclesRepository } from '../vehicles/repositories/vehicles.repository';
import { CreateDispatchDto } from './dto/create-dispatch.dto';
import { UpdateDispatchStatusDto } from './dto/update-dispatch-status.dto';
import { CreateStopLogDto } from './dto/create-stop-log.dto';
import { DispatchQueryDto } from './dto/dispatch-query.dto';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { ComplianceStatus, DispatchStatus, VehicleStatus } from '@prisma/client';

@Injectable()
export class DispatchesService {
  constructor(
    private readonly dispatchesRepo: DispatchesRepository,
    private readonly vehiclesRepo: VehiclesRepository,
    private readonly prismaCore: PrismaCentralCoreService,
  ) {}

  async createDispatch(dto: CreateDispatchDto, auditUser?: string) {
    // 1. Verify Vehicle exists & check Compliance + Operational Status
    const vehicle = await this.vehiclesRepo.findById(dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${dto.vehicleId} not found.`);
    }
    if (vehicle.status !== VehicleStatus.ACTIVE) {
      throw new BadRequestException(
        `Vehicle ${vehicle.registrationNumber} cannot be assigned because its status is '${vehicle.status}'.`,
      );
    }
    if (vehicle.complianceStatus === ComplianceStatus.NON_COMPLIANT) {
      throw new BadRequestException(
        `Vehicle ${vehicle.registrationNumber} cannot be assigned because it is NON_COMPLIANT (expired documents).`,
      );
    }

    // 2. Verify Driver Employee exists & check Compliance Status
    const driver = await this.prismaCore.employee.findFirst({
      where: { id: dto.driverEmployeeId, deletedAt: null },
    });
    if (!driver) {
      throw new NotFoundException(`Driver Employee with ID ${dto.driverEmployeeId} not found.`);
    }
    if (driver.complianceStatus === ('NON_COMPLIANT' as any)) {
      throw new BadRequestException(
        `Driver Employee ID ${dto.driverEmployeeId} cannot be assigned because they are NON_COMPLIANT (expired driving license/medical cert).`,
      );
    }

    // 3. Check Overlapping Shift Assignment
    const dispatchDate = new Date(dto.dispatchDate);
    const shiftName = dto.shiftName || 'MORNING';
    const overlap = await this.dispatchesRepo.findOverlappingDispatch(
      dto.vehicleId,
      dto.driverEmployeeId,
      dispatchDate,
      shiftName,
    );
    if (overlap) {
      throw new ConflictException(
        `Vehicle or Driver is already assigned to active shift ID ${overlap.id} on date ${dto.dispatchDate} (${shiftName}).`,
      );
    }

    return await this.dispatchesRepo.create(dto, auditUser);
  }

  async findAll(query: DispatchQueryDto) {
    return await this.dispatchesRepo.findAll(query);
  }

  async findOne(id: number) {
    const dispatch = await this.dispatchesRepo.findById(id);
    if (!dispatch) {
      throw new NotFoundException(`Dispatch assignment with ID ${id} not found.`);
    }

    const distanceDrivenKm =
      dispatch.startOdometerKm !== null && dispatch.endOdometerKm !== null
        ? Math.max(0, dispatch.endOdometerKm - dispatch.startOdometerKm)
        : null;

    return {
      ...dispatch,
      distanceDrivenKm,
    };
  }

  async updateStatus(id: number, dto: UpdateDispatchStatusDto, auditUser?: string) {
    await this.findOne(id);
    return await this.dispatchesRepo.updateStatus(id, dto, auditUser);
  }

  async recordStop(id: number, dto: CreateStopLogDto, auditUser?: string) {
    const dispatch = await this.findOne(id);
    if (
      dispatch.status !== DispatchStatus.STARTED &&
      dispatch.status !== DispatchStatus.IN_PROGRESS
    ) {
      throw new BadRequestException(
        `Cannot record stop checkpoints on dispatch ID ${id} because its status is '${dispatch.status}'. Must be STARTED or IN_PROGRESS.`,
      );
    }

    // If first stop, transition status to IN_PROGRESS automatically
    if (dispatch.status === DispatchStatus.STARTED) {
      await this.dispatchesRepo.updateStatus(id, { status: DispatchStatus.IN_PROGRESS }, auditUser);
    }

    return await this.dispatchesRepo.addStopLog(id, dto, auditUser);
  }
}
