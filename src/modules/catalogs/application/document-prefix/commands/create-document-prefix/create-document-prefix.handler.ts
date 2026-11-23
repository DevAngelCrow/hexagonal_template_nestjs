import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateDocumentPrefixCommand } from './create-document-prefix.command';
import { DocumentPrefixRepository } from '@/modules/catalogs/domain/repositories/document-prefix-repository';
import { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefix } from '@/modules/catalogs/domain/entities/document-prefix';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

@CommandHandler(CreateDocumentPrefixCommand)
export class CreateDocumentPrefixHandler
  implements ICommandHandler<CreateDocumentPrefixCommand, DocumentPrefixDto>
{
  constructor(
    private readonly repository: DocumentPrefixRepository,
    private readonly queriesRepository: DocumentPrefixQueriesRepository,
  ) {}

  async execute(command: CreateDocumentPrefixCommand): Promise<DocumentPrefixDto> {
    const { dto } = command;
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedPrefix = dto.prefix.trim().toUpperCase();

    const existingCode = await this.queriesRepository.findByCode(normalizedCode);
    if (existingCode) {
      throw new ConflictException(
        `Ya existe una serie de documento con el código '${normalizedCode}'`,
      );
    }

    const existingPrefix = await this.queriesRepository.findByPrefix(normalizedPrefix);
    if (existingPrefix) {
      throw new ConflictException(
        `Ya existe una serie de documento con el prefijo '${normalizedPrefix}'`,
      );
    }

    const currentYear =
      dto.reset_yearly !== false ? new Date().getFullYear() : null;

    const entity = DocumentPrefix.create({
      code: normalizedCode,
      prefix: normalizedPrefix,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      entity_target: dto.entity_target.trim(),
      padding: dto.padding ?? 4,
      reset_yearly: dto.reset_yearly ?? true,
      separator: dto.separator?.trim() || '-',
      current_value: dto.current_value ?? 0,
      current_year: currentYear,
      active: dto.active ?? true,
    });

    const saved = await this.repository.create(entity);
    const id = saved.getId()?.value();
    if (!id) {
      throw new Error('Document prefix id is missing after creation');
    }

    const result = await this.queriesRepository.getOneById(id);
    if (!result) {
      throw new Error('Failed to retrieve created document prefix');
    }
    return result;
  }
}

