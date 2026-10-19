import { PersonId } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-id';
import { GetPersonByIdQuery } from '@/modules/iam/application/profile/queries/person/get-person-by-id/get-person-by-id.query';
import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetPersonByIdQuery)
export class GetPersonByIdHandler implements IQueryHandler<GetPersonByIdQuery> {
  constructor(private readonly repository: PersonRepository) {}
  async execute(query: GetPersonByIdQuery) {
    return await this.repository.findById(new PersonId(query.id));
  }
}
