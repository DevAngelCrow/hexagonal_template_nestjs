import { DocumentDto } from '@/modules/iam/application/profile/dtos/document.dto';

export class UpdateDocumentCommand {
  constructor(public readonly document_dto: DocumentDto) {}
}
