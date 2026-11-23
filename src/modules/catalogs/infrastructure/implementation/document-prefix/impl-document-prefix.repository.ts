import { Injectable } from '@nestjs/common';
import { DocumentPrefixRepository } from '@/modules/catalogs/domain/repositories/document-prefix-repository';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefix } from '@/modules/catalogs/domain/entities/document-prefix';
import { DocumentPrefixId } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-id';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { SequenceGeneratorPort } from '@/shared/application/ports/sequence-generator.port';
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { Prisma, ctl_document_prefix } from 'generated/prisma/client';
import { GetBooleanStatusCatalogService } from '@/shared/infrastructure/services/get-status-catalog.service';
import { StatusMapperUtil } from '@/shared/infrastructure/utils/status-mapper.util';
import { BooleanStatusData } from '@/shared/infrastructure/interfaces/boolean-status-data.interface';
import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class ImplDocumentPrefixRepository
  implements DocumentPrefixRepository, DocumentPrefixQueriesRepository
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceGenerator: SequenceGeneratorPort,
  ) {}

  async create(documentPrefix: DocumentPrefix): Promise<DocumentPrefix> {
    try {
      const created = await this.prisma.client.ctl_document_prefix.create({
        data: {
          code: documentPrefix.getCode().value(),
          prefix: documentPrefix.getPrefix().value(),
          name: documentPrefix.getName().value(),
          description: documentPrefix.getDescription()?.value() ?? null,
          entity_target: documentPrefix.getEntityTarget().value(),
          padding: documentPrefix.getPadding().value(),
          reset_yearly: documentPrefix.getResetYearly().value(),
          separator: documentPrefix.getSeparator().value(),
          current_value: documentPrefix.getCurrentValue().value(),
          current_year: documentPrefix.getCurrentYear()?.value() ?? null,
          active: documentPrefix.getActive().value(),
        },
      });

      return DocumentPrefix.create({
        id: created.id,
        code: created.code,
        prefix: created.prefix,
        name: created.name,
        description: created.description,
        entity_target: created.entity_target,
        padding: created.padding,
        reset_yearly: created.reset_yearly,
        separator: created.separator,
        current_value: created.current_value,
        current_year: created.current_year,
        active: created.active,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DatabaseException(
          `Error al crear prefijo de documento: ${error.message}`,
          'create',
        );
      }
      throw new DatabaseException('Error al crear prefijo de documento', 'create');
    }
  }

  async update(documentPrefix: DocumentPrefix): Promise<DocumentPrefix> {
    const id = documentPrefix.getId()?.value();
    if (!id) {
      throw new NotFoundException('DocumentPrefix', 'unknown');
    }

    try {
      const updated = await this.prisma.client.ctl_document_prefix.update({
        where: { id },
        data: {
          code: documentPrefix.getCode().value(),
          prefix: documentPrefix.getPrefix().value(),
          name: documentPrefix.getName().value(),
          description: documentPrefix.getDescription()?.value() ?? null,
          entity_target: documentPrefix.getEntityTarget().value(),
          padding: documentPrefix.getPadding().value(),
          reset_yearly: documentPrefix.getResetYearly().value(),
          separator: documentPrefix.getSeparator().value(),
          current_value: documentPrefix.getCurrentValue().value(),
          active: documentPrefix.getActive().value(),
        },
      });

      return DocumentPrefix.create({
        id: updated.id,
        code: updated.code,
        prefix: updated.prefix,
        name: updated.name,
        description: updated.description,
        entity_target: updated.entity_target,
        padding: updated.padding,
        reset_yearly: updated.reset_yearly,
        separator: updated.separator,
        current_value: updated.current_value,
        current_year: updated.current_year,
        active: updated.active,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DatabaseException(
          `Error al actualizar prefijo de documento: ${error.message}`,
          'update',
        );
      }
      throw new DatabaseException('Error al actualizar prefijo de documento', 'update');
    }
  }

  async toggleStatus(id: DocumentPrefixId): Promise<DocumentPrefix> {
    const existing = await this.prisma.client.ctl_document_prefix.findUnique({
      where: { id: id.value() },
    });
    if (!existing || existing.deleted_at) {
      throw new NotFoundException('DocumentPrefix', id.value());
    }

    try {
      const updated = await this.prisma.client.ctl_document_prefix.update({
        where: { id: id.value() },
        data: { active: !existing.active },
      });

      return DocumentPrefix.create({
        id: updated.id,
        code: updated.code,
        prefix: updated.prefix,
        name: updated.name,
        description: updated.description,
        entity_target: updated.entity_target,
        padding: updated.padding,
        reset_yearly: updated.reset_yearly,
        separator: updated.separator,
        current_value: updated.current_value,
        current_year: updated.current_year,
        active: updated.active,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new DatabaseException(
          `Error al alternar estado de prefijo de documento: ${error.message}`,
          'toggleStatus',
        );
      }
      throw new DatabaseException('Error al alternar estado', 'toggleStatus');
    }
  }

  async getAll(): Promise<DocumentPrefixDto[]> {
    const [prefixes, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.findMany({
        where: { deleted_at: null },
        orderBy: { name: 'asc' },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    return Promise.all(
      prefixes.map((p) => this.toDto(p, catalogStatus)),
    );
  }

  async getOneById(id: string): Promise<DocumentPrefixDto | null> {
    const [record, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.findFirst({
        where: { id, deleted_at: null },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);
    if (!record) return null;

    return this.toDto(record, catalogStatus);
  }

  async getOneByIdOrCode(identifier: string): Promise<DocumentPrefixDto | null> {
    const isUuid = UUID_REGEX.test(identifier);
    const [record, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.findFirst({
        where: isUuid
          ? { id: identifier, deleted_at: null }
          : { code: identifier.toUpperCase(), deleted_at: null },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);
    if (!record) return null;

    return this.toDto(record, catalogStatus);
  }

  async findByCode(
    code: string,
    excludeId?: string,
  ): Promise<DocumentPrefixDto | null> {
    const where: Prisma.ctl_document_prefixWhereInput = {
      code: code.trim().toUpperCase(),
      deleted_at: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const record = await this.prisma.client.ctl_document_prefix.findFirst({
      where,
    });
    if (!record) return null;

    return this.toDto(record);
  }

  async findByPrefix(
    prefix: string,
    excludeId?: string,
  ): Promise<DocumentPrefixDto | null> {
    const where: Prisma.ctl_document_prefixWhereInput = {
      prefix: prefix.trim().toUpperCase(),
      deleted_at: null,
    };
    if (excludeId) {
      where.id = { not: excludeId };
    }

    const record = await this.prisma.client.ctl_document_prefix.findFirst({
      where,
    });
    if (!record) return null;

    return this.toDto(record);
  }

  private async toDto(
    p: ctl_document_prefix,
    catalogStatus?: Map<string, BooleanStatusData>,
  ): Promise<DocumentPrefixDto> {
    let nextPreview = '';
    try {
      nextPreview = await this.sequenceGenerator.peek(p.code);
    } catch {
      const year = p.reset_yearly
        ? p.current_year || new Date().getFullYear()
        : null;
      const nextVal = (p.current_value || 0) + 1;
      const padded = String(nextVal).padStart(p.padding, '0');
      nextPreview = year
        ? `${p.prefix}${p.separator}${year}${p.separator}${padded}`
        : `${p.prefix}${p.separator}${padded}`;
    }

    let status: GlobalStatusDto | undefined = undefined;
    if (catalogStatus) {
      try {
        status = StatusMapperUtil.getStatusFromBoolean(
          p.active,
          catalogStatus,
          'toDto',
        );
      } catch {
        status = undefined;
      }
    }

    return new DocumentPrefixDto({
      id: p.id,
      code: p.code,
      prefix: p.prefix,
      name: p.name,
      description: p.description,
      entity_target: p.entity_target,
      current_year: p.current_year,
      current_value: p.current_value,
      padding: p.padding,
      reset_yearly: p.reset_yearly,
      separator: p.separator,
      next_preview: nextPreview,
      active: p.active,
      status,
      created_at: p.created_at,
    });
  }
}

