import { AddressId } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-id';
import { GetAddressByIdQuery } from '@/modules/iam/application/profile/queries/address/get-address-by-id/get-address-by-id.query';
import { AddressReadRepository } from '@/modules/iam/application/repositories/address-read.repository';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';

@QueryHandler(GetAddressByIdQuery)
export class GetAddressByIdHandler implements IQueryHandler<GetAddressByIdQuery> {
  constructor(private readonly repository: AddressReadRepository) {}
  async execute(query: GetAddressByIdQuery) {
    return await this.repository.getOneById(new AddressId(query.id));
  }
}
