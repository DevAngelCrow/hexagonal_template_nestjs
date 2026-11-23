import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ToggleStatusDocumentPrefixCommand } from './toggle-status-document-prefix.command';
import { DocumentPrefixRepository } from '@/modules/catalogs/domain/repositories/document-prefix-repository';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefixId } from '@/modules/catalogs/domain/value-objects/document-prefix-value-object/document-prefix-id';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';

@CommandHandler(ToggleStatusDocumentPrefixCommand)
export class ToggleStatusDocumentPrefixHandler
  implements ICommandHandler<ToggleStatusDocumentPrefixCommand, DocumentPrefixDto>
{
  constructor(
    private readonly repository: DocumentPrefixRepository,
    private readonly queriesRepository: DocumentPrefixQueriesRepository,
  ) {}

  async execute(command: ToggleStatusDocumentPrefixCommand): Promise<DocumentPrefixDto> {
    const existing = await this.queriesRepository.getOneByIdOrCode(command.id);
    if (!existing) {
      throw new NotFoundException('DocumentPrefix', command.id);
    }

    await this.repository.toggleStatus(new DocumentPrefixId(existing.id));

    const updated = await this.queriesRepository.getOneById(existing.id);
    if (!updated) {
      throw new Error('Failed to retrieve toggled document prefix');
    }
    return updated;
  }
}

