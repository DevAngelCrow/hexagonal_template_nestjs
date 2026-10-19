import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { DocumentReadRepository } from '@/modules/iam/application/repositories/document-read.repository';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { Document } from '@/modules/iam/domain/entities/document.entity';
import { DocumentId } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id';
import { DocumentNumberDoc } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-number-doc';
import { DocumentDescription } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-description';
import { DocumentIdPerson } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id-people';
import { DocumentIdTypeDocument } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id-type-document';
import { DocumentActive } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-active';

@Injectable()
export class ImplDocumentReadRepository implements DocumentReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAll() // pagination_params?: PaginationParams,
  // filter?: string,
  : Promise<Pagination<Document> | Document[]> {
    const docsDb = await this.prisma.client.mnt_document.findMany();
    return docsDb.map((d) =>
      Document.create({
        id: d.id ? new DocumentId(d.id) : null,
        number_document: new DocumentNumberDoc(d.document_number),
        description: d.description
          ? new DocumentDescription(d.description)
          : undefined,
        id_people: new DocumentIdPerson(d.id_people),
        id_type_document: new DocumentIdTypeDocument(d.id_document_type), // Map it correctly based on schema
        active: new DocumentActive(d.active),
      }),
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
