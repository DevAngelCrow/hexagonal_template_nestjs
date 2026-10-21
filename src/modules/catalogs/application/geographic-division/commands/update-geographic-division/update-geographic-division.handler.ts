import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GeographicDivision } from '@/modules/catalogs/domain/entities/geographic-division';
import { GeographicDivisionRepository } from '@/modules/catalogs/domain/repositories/geographic-division-repository';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { GeographicDivisionQueriesRepository } from '@/modules/catalogs/application/repositories/geographic-division-read.repository';
import { UpdateGeographicDivisionCommand } from './update-geographic-division.command';

@CommandHandler(UpdateGeographicDivisionCommand)
export class UpdateGeographicDivisionHandler implements ICommandHandler<UpdateGeographicDivisionCommand> {
  constructor(
    private readonly repository: GeographicDivisionRepository,
    private readonly readRepository: GeographicDivisionQueriesRepository,
  ) {}

  async execute(command: UpdateGeographicDivisionCommand): Promise<void> {
    const entity = GeographicDivision.create({ ...command.dto });
    const id = entity.getId();
    if (!id) throw new BadRequestException('GeographicDivision id is required for update');

    const found = await this.readRepository.getOneById(id.value());
    if (!found) throw new NotFoundException('GeographicDivision', id.value());

    await this.repository.update(entity);
  }
}
