import { Injectable, NotFoundException } from '@nestjs/common';
import { ComplianceDocumentsRepository } from './repositories/compliance-documents.repository';
import { CreateComplianceDocDto } from './dto/create-compliance-doc.dto';
import { ComplianceDocQueryDto } from './dto/compliance-doc-query.dto';
import { ComplianceDocStatus, ComplianceEntityType } from '@prisma/client-central-core';

@Injectable()
export class ComplianceService {
  constructor(private readonly complianceRepo: ComplianceDocumentsRepository) {}

  async createDocument(dto: CreateComplianceDocDto, auditUser?: string) {
    const doc = await this.complianceRepo.create(dto, auditUser);
    return doc;
  }

  async findAll(query: ComplianceDocQueryDto) {
    return await this.complianceRepo.findAll(query);
  }

  async findOne(id: number) {
    const doc = await this.complianceRepo.findById(id);
    if (!doc) {
      throw new NotFoundException(`Compliance document with ID ${id} not found.`);
    }
    return doc;
  }

  async remove(id: number, auditUser?: string) {
    await this.findOne(id);
    return await this.complianceRepo.softDelete(id, auditUser);
  }

  async checkEntityCompliance(
    entityType: ComplianceEntityType,
    entityId: number,
    requiredDocTypes: string[] = [],
  ): Promise<{ isCompliant: boolean; missingOrExpiredDocs: string[] }> {
    const docs = await this.complianceRepo.findActiveDocsForEntity(entityType, entityId);
    const now = new Date();
    const missingOrExpiredDocs: string[] = [];

    for (const reqDocType of requiredDocTypes) {
      const matchingDoc = docs.find(
        (d) =>
          d.documentType.toUpperCase() === reqDocType.toUpperCase() &&
          d.status === ComplianceDocStatus.VALID &&
          new Date(d.expiryDate) > now,
      );
      if (!matchingDoc) {
        missingOrExpiredDocs.push(reqDocType);
      }
    }

    return {
      isCompliant: missingOrExpiredDocs.length === 0,
      missingOrExpiredDocs,
    };
  }
}
