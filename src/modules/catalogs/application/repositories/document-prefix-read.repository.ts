import { DocumentPrefixDto } from '../dtos/document-prefix.dto';

export abstract class DocumentPrefixQueriesRepository {
  abstract getAll(): Promise<DocumentPrefixDto[]>;
  abstract getOneById(id: string): Promise<DocumentPrefixDto | null>;
  abstract getOneByIdOrCode(identifier: string): Promise<DocumentPrefixDto | null>;
  abstract findByCode(code: string, excludeId?: string): Promise<DocumentPrefixDto | null>;
  abstract findByPrefix(prefix: string, excludeId?: string): Promise<DocumentPrefixDto | null>;
}

