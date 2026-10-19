import { DocumentType } from '@/modules/iam/domain/entities/document-type.entity';
import { DocumentTypeId } from '@/modules/iam/domain/value-objects/profile/document-type-value-object/document-type-id';

export abstract class DocumentTypeRepository {
  abstract create(documentType: DocumentType): Promise<void>;
  abstract update(documentType: DocumentType): Promise<void>;
  abstract toggleStatus(id: DocumentTypeId): Promise<DocumentType>;
}
