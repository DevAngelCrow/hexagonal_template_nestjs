import { GetPersonByEmailQuery } from '@/modules/iam/application/profile/queries/person/get-person-by-email/get-person-by-email.query';
import { PersonReadRepository } from '@/modules/iam/application/repositories/person-read.repository';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetPersonByEmailQuery)
export class GetPersonByEmailHandler implements IQueryHandler<GetPersonByEmailQuery> {
  constructor(private readonly repository: PersonReadRepository) {}
  async execute(query: GetPersonByEmailQuery) {
    return await this.repository.getOneByEmail(new PersonEmail(query.email));
  }
}
