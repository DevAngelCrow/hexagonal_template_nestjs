import { DocumentTypeRepository } from '@/modules/iam/domain/repositories/document-type.repository';
import { DeleteDocumentTypeCommand } from '@/modules/iam/application/profile/commands/document-type/delete-document-type/delete-document-type.command';
import { DocumentTypeId } from '@/modules/iam/domain/value-objects/profile/document-type-value-object/document-type-id';
import { DocumentTypeDto } from '@/modules/iam/application/profile/dtos/document-type.dto';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

@CommandHandler(DeleteDocumentTypeCommand)
export class DeleteDocumentTypeHandler implements ICommandHandler<DeleteDocumentTypeCommand> {
  constructor(private readonly repository: DocumentTypeRepository) {}

  async execute(command: DeleteDocumentTypeCommand): Promise<DocumentTypeDto> {
    const documentTypeEntity = await this.repository.toggleStatus(
      new DocumentTypeId(command.id),
    );
    const documentTypeDto = DocumentTypeDto.fromEntity(documentTypeEntity);
    return documentTypeDto;
  }
}
