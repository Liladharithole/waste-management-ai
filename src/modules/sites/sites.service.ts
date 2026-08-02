import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../prisma-central-core/prisma-central-core.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { GoogleMapsService } from '../google-maps/google-maps.service';

@Injectable()
export class SitesService {
  constructor(
    private readonly prismaCore: PrismaCentralCoreService,
    private readonly googleMapsService: GoogleMapsService,
  ) {}

  /**
   * Retrieves all active sites, optionally filtered by organization ID.
   */
  async findAll(organizationId?: number) {
    return await this.prismaCore.site.findMany({
      where: {
        deletedAt: null,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        organization: true,
        buildings: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Retrieves a single site by ID.
   */
  async findOne(id: number) {
    const site = await this.prismaCore.site.findUnique({
      where: { id },
      include: {
        organization: true,
        buildings: true,
      },
    });
    if (!site || site.deletedAt) {
      throw new NotFoundException(`Site with ID ${id} not found.`);
    }
    return site;
  }

  /**
   * Creates a new site under an existing organization.
   */
  async create(dto: CreateSiteDto) {
    const org = await this.prismaCore.organization.findUnique({
      where: { id: dto.organizationId },
    });
    if (!org) {
      throw new NotFoundException(`Organization with ID ${dto.organizationId} not found.`);
    }

    return this.prismaCore.site.create({
      data: dto,
    });
  }

  /**
   * Updates site properties and address coordinates.
   */
  async update(id: number, dto: UpdateSiteDto) {
    await this.findOne(id);
    return this.prismaCore.site.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Deletes a site after checking active building dependencies.
   */
  async delete(id: number) {
    await this.findOne(id);

    const buildingCount = await this.prismaCore.building.count({
      where: { siteId: id },
    });
    if (buildingCount > 0) {
      throw new ConflictException(
        `Cannot delete site because it currently contains ${buildingCount} building(s). Please remove or reassign these buildings first.`,
      );
    }

    return this.prismaCore.site.delete({
      where: { id },
    });
  }

  /**
   * Retrieves address autocomplete suggestions via Google Maps Service proxy.
   */
  async getAddressSuggestions(input: string) {
    return this.googleMapsService.getAddressSuggestions(input);
  }
}
