import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDocumentPrefixCommand } from './update-document-prefix.command';
import { DocumentPrefixRepository } from '@/modules/catalogs/domain/repositories/document-prefix-repository';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefix } from '@/modules/catalogs/domain/entities/document-prefix';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

@CommandHandler(UpdateDocumentPrefixCommand)
export class UpdateDocumentPrefixHandler
  implements ICommandHandler<UpdateDocumentPrefixCommand, DocumentPrefixDto>
{
  constructor(
    private readonly repository: DocumentPrefixRepository,
    private readonly queriesRepository: DocumentPrefixQueriesRepository,
  ) {}

  async execute(command: UpdateDocumentPrefixCommand): Promise<DocumentPrefixDto> {
    const { id, dto } = command;
    const existing = await this.queriesRepository.getOneByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('DocumentPrefix', id);
    }

    let normalizedPrefix = existing.prefix;
    if (dto.prefix) {
      normalizedPrefix = dto.prefix.trim().toUpperCase();
      const prefixConflict = await this.queriesRepository.findByPrefix(
        normalizedPrefix,
        existing.id,
      );
      if (prefixConflict) {
        throw new ConflictException(
          `El prefijo '${normalizedPrefix}' ya está en uso por la serie '${prefixConflict.name}'.`,
        );
      }
    }

    const entity = DocumentPrefix.create({
      id: existing.id,
      code: existing.code,
      prefix: normalizedPrefix,
      name: dto.name !== undefined ? dto.name.trim() : existing.name,
      description:
        dto.description !== undefined
          ? dto.description?.trim() || null
          : existing.description,
      entity_target:
        dto.entity_target !== undefined
          ? dto.entity_target.trim()
          : existing.entity_target,
      padding: dto.padding !== undefined ? dto.padding : existing.padding,
      reset_yearly:
        dto.reset_yearly !== undefined
          ? dto.reset_yearly
          : existing.reset_yearly,
      separator:
        dto.separator !== undefined ? dto.separator.trim() : existing.separator,
      current_value:
        dto.current_value !== undefined
          ? dto.current_value
          : existing.current_value,
      current_year: existing.current_year,
      active: dto.active !== undefined ? dto.active : existing.active,
    });

    await this.repository.update(entity);

    const updated = await this.queriesRepository.getOneById(existing.id);
    if (!updated) {
      throw new Error('Failed to retrieve updated document prefix');
    }
    return updated;
  }
}

