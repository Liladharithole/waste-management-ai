import { Injectable } from '@nestjs/common';
import { PrismaCentralCoreService } from '../../../prisma-central-core/prisma-central-core.service';
import { CreateComplianceDocDto } from '../dto/create-compliance-doc.dto';
import { ComplianceDocQueryDto } from '../dto/compliance-doc-query.dto';
import { ComplianceDocStatus, ComplianceEntityType } from '@prisma/client-central-core';

@Injectable()
export class ComplianceDocumentsRepository {
  constructor(private readonly prismaCore: PrismaCentralCoreService) {}

  async create(dto: CreateComplianceDocDto, auditUser?: string) {
    return await this.prismaCore.complianceDocument.create({
      data: {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        documentType: dto.documentType,
        documentNumber: dto.documentNumber,
        documentUrl: dto.documentUrl,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : null,
        expiryDate: new Date(dto.expiryDate),
        status:
          new Date(dto.expiryDate) < new Date()
            ? ComplianceDocStatus.EXPIRED
            : ComplianceDocStatus.VALID,
        createdBy: auditUser,
      },
    });
  }

  async findAll(query: ComplianceDocQueryDto) {
    const page = Number(query.page || 1);
    const limit = Number(query.limit || 10);
    const skip = (page - 1) * limit;

    const whereClause: any = {
      deletedAt: null,
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.documentType ? { documentType: query.documentType } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prismaCore.complianceDocument.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: { expiryDate: 'asc' },
      }),
      this.prismaCore.complianceDocument.count({ where: whereClause }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: number) {
    return await this.prismaCore.complianceDocument.findFirst({
      where: { id, deletedAt: null },
    });
  }

  async updateStatus(id: number, status: ComplianceDocStatus, auditUser?: string) {
    return await this.prismaCore.complianceDocument.update({
      where: { id },
      data: {
        status,
        updatedBy: auditUser,
      },
    });
  }

  async softDelete(id: number, auditUser?: string) {
    return await this.prismaCore.complianceDocument.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: auditUser,
      },
    });
  }

  async findActiveDocsForEntity(entityType: ComplianceEntityType, entityId: number) {
    return await this.prismaCore.complianceDocument.findMany({
      where: {
        entityType,
        entityId,
        deletedAt: null,
      },
    });
  }
}
