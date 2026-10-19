import { UpdateDocumentCommand } from '@/modules/iam/application/profile/commands/document/update-document/update-document.command';
import { UpdateDocumentHandler } from '@/modules/iam/application/profile/commands/document/update-document/update-document.handler';
import { DocumentDto } from '@/modules/iam/application/profile/dtos/document.dto';
export class DocumentUpdateService {
  constructor(private readonly documentUpdate: UpdateDocumentHandler) {}
  async run(document_dto: DocumentDto): Promise<void> {
    const documentCommand = new UpdateDocumentCommand(document_dto);
    return await this.documentUpdate.execute(documentCommand);
  }
}
