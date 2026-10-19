import { DocumentTypeRepository } from '@/modules/iam/domain/repositories/document-type.repository';
import { CreateDocumentTypeCommand } from '@/modules/iam/application/profile/commands/document-type/create-document-type/create-document-type.command';
import { DocumentType } from '@/modules/iam/domain/entities/document-type.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(CreateDocumentTypeCommand)
export class CreateDocumentTypeHandler implements ICommandHandler<CreateDocumentTypeCommand> {
  constructor(private readonly repository: DocumentTypeRepository) {}

  async execute(command: CreateDocumentTypeCommand): Promise<void> {
    const documentType = DocumentType.create({ ...command.document_type_dto });
    return await this.repository.create(documentType);
  }
}
