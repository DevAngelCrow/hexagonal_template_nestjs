import { DocumentTypeDto } from '@/modules/iam/application/profile/dtos/document-type.dto';

export class UpdateDocumentTypeCommand {
  constructor(public readonly document_type_dto: DocumentTypeDto) {}
}
