import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { AddAddressDto } from './dto/add-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Retrieves all organizations, including their settings and addresses.
   */
  async findAll() {
    return this.prismaCore.organization.findMany({
      where: { deletedAt: null },
      include: {
        settings: true,
        addresses: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Creates a new organization, its settings, and its primary address in a single transaction.
   */
  async create(createOrganizationDto: CreateOrganizationDto) {
    const {
      name,
      fullName,
      shortName,
      type,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
    } = createOrganizationDto;

    // Check unique name constraint
    const existing = await this.prismaCore.organization.findUnique({
      where: { name },
    });
    if (existing) {
      throw new ConflictException(`Organization with name '${name}' already exists.`);
    }

    return this.prismaCore.$transaction(async (tx) => {
      // 1. Create Organization
      const org = await tx.organization.create({
        data: {
          name,
          fullName,
          shortName,
          type,
        },
      });

      // 2. Initialize default organization settings
      await tx.organizationSettings.create({
        data: {
          organizationId: org.id,
          theme: 'light',
          timezone: 'Asia/Kolkata',
          language: 'en',
        },
      });

      // 3. Create primary address
      await tx.organizationAddress.create({
        data: {
          organizationId: org.id,
          addressLabel: 'Primary Office',
          addressLine1,
          addressLine2,
          city,
          state,
          postalCode,
          country: country || 'India',
          latitude,
          longitude,
          isDefault: true,
        },
      });

      // Return complete organization profile
      return tx.organization.findUnique({
        where: { id: org.id },
        include: {
          settings: true,
          addresses: true,
        },
      });
    });
  }

  /**
   * Updates organization properties.
   */
  async update(id: number, updateOrganizationDto: UpdateOrganizationDto) {
    const existing = await this.prismaCore.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    const data: any = {};
    if (updateOrganizationDto.fullName !== undefined) {
      data.fullName = updateOrganizationDto.fullName;
    }
    if (updateOrganizationDto.shortName !== undefined) {
      data.shortName = updateOrganizationDto.shortName;
    }
    if (updateOrganizationDto.type !== undefined) {
      data.type = updateOrganizationDto.type;
    }
    if (updateOrganizationDto.status !== undefined) {
      data.status = updateOrganizationDto.status;
    }

    if (updateOrganizationDto.name) {
      if (updateOrganizationDto.name !== existing.name) {
        const conflict = await this.prismaCore.organization.findUnique({
          where: { name: updateOrganizationDto.name },
        });
        if (conflict) {
          throw new ConflictException(
            `Organization with name '${updateOrganizationDto.name}' already exists.`,
          );
        }
        data.name = updateOrganizationDto.name;
      }
    }

    return this.prismaCore.organization.update({
      where: { id },
      data,
      include: {
        settings: true,
        addresses: true,
      },
    });
  }

  /**
   * Deletes an organization after checking active dependencies.
   */
  async delete(id: number) {
    const existing = await this.prismaCore.organization.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Organization with ID ${id} not found.`);
    }

    // Safety checks: check if any Employees are linked
    const employeeCount = await this.prismaCore.employee.count({
      where: { organizationId: id },
    });

    // Safety checks: check if any Sites are linked
    const siteCount = await this.prismaCore.site.count({
      where: { organizationId: id },
    });

    if (employeeCount > 0 || siteCount > 0) {
      throw new ConflictException(
        `Cannot delete organization because it is currently linked to ${employeeCount} employee(s) and ${siteCount} site(s). Please remove or reassign these relations first.`,
      );
    }

    return this.prismaCore.organization.delete({
      where: { id },
    });
  }

  /**
   * Retrieves address autocomplete suggestions from Google Places API (New).
   */
  async getAddressSuggestions(input: string) {
    return this.googleMapsService.getAddressSuggestions(input);
  }

  /**
   * Adds a new address to an organization, managing default flags transactionally.
   */
  async addAddress(orgId: number, dto: AddAddressDto) {
    const org = await this.prismaCore.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${orgId} not found.`);
    }

    return this.prismaCore.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.organizationAddress.updateMany({
          where: { organizationId: orgId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.organizationAddress.create({
        data: {
          ...dto,
          organizationId: orgId,
        },
      });
    });
  }

  /**
   * Updates an organization address, managing default flags transactionally.
   */
  async updateAddress(orgId: number, addressId: number, dto: UpdateAddressDto) {
    const address = await this.prismaCore.organizationAddress.findFirst({
      where: { id: addressId, organizationId: orgId },
    });
    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found for this organization.`);
    }

    return this.prismaCore.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.organizationAddress.updateMany({
          where: { organizationId: orgId, isDefault: true },
          data: { isDefault: false },
        });
      }
      return tx.organizationAddress.update({
        where: { id: addressId },
        data: dto,
      });
    });
  }

  /**
   * Deletes an organization address with safety constraints.
   */
  async deleteAddress(orgId: number, addressId: number) {
    const address = await this.prismaCore.organizationAddress.findFirst({
      where: { id: addressId, organizationId: orgId },
    });
    if (!address) {
      throw new NotFoundException(`Address with ID ${addressId} not found for this organization.`);
    }

    // Safety Constraint 1: An organization must have at least one address
    const totalAddresses = await this.prismaCore.organizationAddress.count({
      where: { organizationId: orgId },
    });
    if (totalAddresses <= 1) {
      throw new ConflictException(
        'Cannot delete the only address of an organization. Organizations must have at least one address.',
      );
    }

    // Safety Constraint 2: Cannot delete default address directly
    if (address.isDefault) {
      throw new ConflictException(
        'Cannot delete the default address. Please assign another address as default first.',
      );
    }

    return this.prismaCore.organizationAddress.delete({
      where: { id: addressId },
    });
  }
}
