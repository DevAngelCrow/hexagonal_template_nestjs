import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { DocumentReadRepository } from '@/modules/iam/application/repositories/document-read.repository';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { EntityList } from '@/shared/domain/value-object/entity-list';
import { TotalItems } from '@/shared/domain/value-object/total-items';
import { TotalPages } from '@/shared/domain/value-object/total-page';
import { Document } from '@/modules/iam/domain/entities/document.entity';
import { DocumentId } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id';
import { DocumentNumberDoc } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-number-doc';
import { DocumentDescription } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-description';
import { DocumentIdPerson } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id-people';
import { DocumentIdTypeDocument } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id-type-document';
import { DocumentActive } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-active';

const UNPAGINATED_DEFAULT_TAKE = 100;

@Injectable()
export class ImplDocumentReadRepository implements DocumentReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(
    pagination_params?: PaginationParams,
    filter?: string,
    id_people?: string,
  ): Promise<Pagination<Document> | Document[]> {
    const where: Prisma.mnt_documentWhereInput = {};
    if (id_people) {
      where.id_people = id_people;
    }
    if (filter && filter.trim().length > 0) {
      const term = filter.trim();
      where.OR = [
        { document_number: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = pagination_params?.getPage().value();
    const perPage = pagination_params?.getPerPage().value();

    const [docsDb, totalCount] = await Promise.all([
      this.prisma.client.mnt_document.findMany({
        where,
        skip: page && perPage ? (page - 1) * perPage : 0,
        take: perPage ?? UNPAGINATED_DEFAULT_TAKE,
      }),
      pagination_params
        ? this.prisma.client.mnt_document.count({ where })
        : Promise.resolve(0),
    ]);

    const entities = docsDb.map((d) =>
      Document.create({
        id: d.id ? new DocumentId(d.id) : null,
        number_document: new DocumentNumberDoc(d.document_number),
        description: d.description
          ? new DocumentDescription(d.description)
          : undefined,
        id_people: new DocumentIdPerson(d.id_people),
        id_type_document: new DocumentIdTypeDocument(d.id_document_type),
        active: new DocumentActive(d.active),
      }),
    );

    if (!pagination_params) {
      return entities;
    }

    const perPageValue = pagination_params.getPerPage().value();
    return new Pagination<Document>(
      new EntityList<Document>(entities),
      pagination_params.getPage(),
      pagination_params.getPerPage(),
      new TotalItems(totalCount),
      new TotalPages(Math.ceil(totalCount / perPageValue)),
    );
  }

  async getOneById(id: DocumentId): Promise<Document | null> {
    const d = await this.prisma.client.mnt_document.findUnique({
      where: { id: id.value() },
    });
    if (!d) return null;
    return Document.create({
      id: d.id ? new DocumentId(d.id) : null,
      number_document: new DocumentNumberDoc(d.document_number),
      description: d.description
        ? new DocumentDescription(d.description)
        : undefined,
      id_people: new DocumentIdPerson(d.id_people),
      id_type_document: new DocumentIdTypeDocument(d.id_document_type),
      active: new DocumentActive(d.active),
    });
  }
}
