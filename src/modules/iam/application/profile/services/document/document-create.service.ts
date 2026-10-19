import { CreateDocumentCommand } from '@/modules/iam/application/profile/commands/document/create-document/create-document.command';
import { CreateDocumentHandler } from '@/modules/iam/application/profile/commands/document/create-document/create-document.handler';
import { DocumentDto } from '@/modules/iam/application/profile/dtos/document.dto';
export class DocumentCreateService {
  constructor(private readonly documentCreate: CreateDocumentHandler) {}
  async run(document_dto: DocumentDto): Promise<void> {
    const documentCommand = new CreateDocumentCommand(document_dto);
    await this.documentCreate.execute(documentCommand);
  }
}
