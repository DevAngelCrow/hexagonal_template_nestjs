import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDocumentPrefixesQuery } from './get-document-prefixes.query';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';

@QueryHandler(GetDocumentPrefixesQuery)
export class GetDocumentPrefixesHandler
  implements IQueryHandler<GetDocumentPrefixesQuery, DocumentPrefixDto[]>
{
  constructor(
    private readonly queriesRepository: DocumentPrefixQueriesRepository,
  ) {}

  async execute(): Promise<DocumentPrefixDto[]> {
    return this.queriesRepository.getAll();
  }
}

