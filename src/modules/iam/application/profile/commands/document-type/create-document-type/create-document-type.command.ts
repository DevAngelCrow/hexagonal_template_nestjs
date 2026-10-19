import { DocumentTypeDto } from '@/modules/iam/application/profile/dtos/document-type.dto';

export class CreateDocumentTypeCommand {
  constructor(public readonly document_type_dto: DocumentTypeDto) {}
}
