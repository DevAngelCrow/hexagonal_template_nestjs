import { DocumentDto } from '@/modules/iam/application/profile/dtos/document.dto';

export class CreateDocumentCommand {
  constructor(public readonly document_dto: DocumentDto) {}
}
