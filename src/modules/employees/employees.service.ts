import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeesRepository } from './repositories/employees.repository';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { createPaginatedResponse } from '../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

@Injectable()
export class EmployeesService {
  constructor(private readonly employeesRepository: EmployeesRepository) {}

  /**
   * Retrieves all active employee records with pagination.
   */
  async findAll(paginationDto: PaginationQueryDto, organizationId?: number) {
    const { page = 1, limit = 10, search } = paginationDto;
    const { data, total } = await this.employeesRepository.findAll(
      organizationId,
      page,
      limit,
      search,
    );
    return createPaginatedResponse(data, total, page, limit);
  }

  /**
   * Retrieves a single employee record by ID.
   */
  async findOne(id: number) {
    const employee = await this.employeesRepository.findById(id);
    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee record with ID ${id} not found.`);
    }
    return employee;
  }

  /**
   * Creates a new employee record hiring a user under an organization.
   */
  async create(dto: CreateEmployeeDto, createdBy?: string) {
    // 1. Verify user exists
    const user = await this.employeesRepository.findUserById(dto.userId);
    if (!user || user.deletedAt) {
      throw new NotFoundException(`User with ID ${dto.userId} not found.`);
    }

    // 2. Verify organization exists
    const org = await this.employeesRepository.findOrganizationById(dto.organizationId);
    if (!org || org.deletedAt) {
      throw new NotFoundException(`Organization with ID ${dto.organizationId} not found.`);
    }

    // 3. Verify user is not already actively hired as an employee
    const existingUserEmployee = await this.employeesRepository.findByUserId(dto.userId);
    if (existingUserEmployee) {
      throw new ConflictException(
        `User with ID ${dto.userId} is already hired as an employee under organization ID ${existingUserEmployee.organizationId}.`,
      );
    }

    // 4. Verify employeeCode uniqueness if provided
    if (dto.employeeCode) {
      const existingCode = await this.employeesRepository.findByEmployeeCode(dto.employeeCode);
      if (existingCode) {
        throw new ConflictException(`Employee code '${dto.employeeCode}' is already in use.`);
      }
    }

    return await this.employeesRepository.create(dto, createdBy);
  }

  /**
   * Updates an existing employee record.
   */
  async update(id: number, dto: UpdateEmployeeDto, updatedBy?: string) {
    await this.findOne(id);

    if (dto.organizationId) {
      const org = await this.employeesRepository.findOrganizationById(dto.organizationId);
      if (!org || org.deletedAt) {
        throw new NotFoundException(`Organization with ID ${dto.organizationId} not found.`);
      }
    }

    if (dto.userId) {
      const user = await this.employeesRepository.findUserById(dto.userId);
      if (!user || user.deletedAt) {
        throw new NotFoundException(`User with ID ${dto.userId} not found.`);
      }
    }

    if (dto.employeeCode) {
      const existingCode = await this.employeesRepository.findByEmployeeCode(dto.employeeCode);
      if (existingCode && existingCode.id !== id) {
        throw new ConflictException(`Employee code '${dto.employeeCode}' is already in use.`);
      }
    }

    return await this.employeesRepository.update(id, dto, updatedBy);
  }

  /**
   * Soft-deletes an employee record.
   */
  async delete(id: number, deletedBy?: string) {
    await this.findOne(id);
    return await this.employeesRepository.softDelete(id, deletedBy);
  }
}
