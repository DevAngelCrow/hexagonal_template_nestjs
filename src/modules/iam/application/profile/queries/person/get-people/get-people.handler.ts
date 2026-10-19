import { Pagination } from '@/shared/domain/value-object/pagination';
import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { GetPeopleQuery } from '@/modules/iam/application/profile/queries/person/get-people/get-people.query';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { PersonReadRepository } from '@/modules/iam/application/repositories/person-read.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetPeopleQuery)
export class GetPeopleHandler implements IQueryHandler<GetPeopleQuery> {
  constructor(private readonly repository: PersonReadRepository) {}
  async execute(query: GetPeopleQuery): Promise<Pagination<Person> | Person[]> {
    if (query.pagination_params) {
      const paginationParams = PaginationParams.create({
        ...query.pagination_params,
      });
      return await this.repository.getAll(paginationParams, query.filter);
    }
    return await this.repository.getAll(undefined, query.filter);
  }
}
