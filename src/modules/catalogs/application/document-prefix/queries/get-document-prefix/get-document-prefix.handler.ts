import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDocumentPrefixQuery } from './get-document-prefix.query';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';

@QueryHandler(GetDocumentPrefixQuery)
export class GetDocumentPrefixHandler
  implements IQueryHandler<GetDocumentPrefixQuery, DocumentPrefixDto>
{
  constructor(
    private readonly queriesRepository: DocumentPrefixQueriesRepository,
  ) {}

  async execute(query: GetDocumentPrefixQuery): Promise<DocumentPrefixDto> {
    const item = await this.queriesRepository.getOneByIdOrCode(query.identifier);
    if (!item) {
      throw new NotFoundException('DocumentPrefix', query.identifier);
    }
    return item;
  }
}

