import { DocumentTypeRepository } from '@/modules/iam/domain/repositories/document-type.repository';
import { UpdateDocumentTypeCommand } from '@/modules/iam/application/profile/commands/document-type/update-document-type/update-document-type.command';
import { DocumentType } from '@/modules/iam/domain/entities/document-type.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(UpdateDocumentTypeCommand)
export class UpdateDocumentTypeHandler implements ICommandHandler<UpdateDocumentTypeCommand> {
  constructor(private readonly repository: DocumentTypeRepository) {}

  async execute(command: UpdateDocumentTypeCommand): Promise<void> {
    const documentType = DocumentType.create({ ...command.document_type_dto });
    await this.repository.update(documentType);
  }
}
