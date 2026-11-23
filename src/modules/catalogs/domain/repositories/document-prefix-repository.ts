import { DocumentPrefix } from '@/modules/catalogs/domain/entities/document-prefix';
import { DocumentPrefixId } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-id';

export abstract class DocumentPrefixRepository {
  abstract create(documentPrefix: DocumentPrefix): Promise<DocumentPrefix>;
  abstract update(documentPrefix: DocumentPrefix): Promise<DocumentPrefix>;
  abstract toggleStatus(id: DocumentPrefixId): Promise<DocumentPrefix>;
}

