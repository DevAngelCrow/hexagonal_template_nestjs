import { DocumentId } from '@/modules/iam/domain/value-objects/profile/document-value-object/document-id';
import { GetDocumentByIdQuery } from '@/modules/iam/application/profile/queries/document/get-document-by-id/get-document-by-id.query';
import { DocumentReadRepository } from '@/modules/iam/application/repositories/document-read.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetDocumentByIdQuery)
export class GetDocumentByIdHandler implements IQueryHandler<GetDocumentByIdQuery> {
  constructor(private readonly repository: DocumentReadRepository) {}

  async execute(query: GetDocumentByIdQuery) {
    return await this.repository.getOneById(new DocumentId(query.id));
  }
}
