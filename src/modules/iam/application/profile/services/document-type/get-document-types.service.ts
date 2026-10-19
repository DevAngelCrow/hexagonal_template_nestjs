import { Pagination } from '@/shared/domain/value-object/pagination';
import { GetDocumentTypesHandler } from '@/modules/iam/application/profile/queries/document-type/get-document-types/get-document-types.handler';
import { GetDocumentTypesQuery } from '@/modules/iam/application/profile/queries/document-type/get-document-types/get-document-types.query';
import { DocumentTypeDto } from '@/modules/iam/application/profile/dtos/document-type.dto';

export class GetDocumentTypesService {
  constructor(
    private readonly getDocumentTypesHandler: GetDocumentTypesHandler,
  ) {}

  async run(
    query: GetDocumentTypesQuery,
  ): Promise<Pagination<DocumentTypeDto> | DocumentTypeDto[]> {
    return await this.getDocumentTypesHandler.execute(query);
  }
}
