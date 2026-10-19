import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { Address } from '@/modules/iam/domain/entities/address.entity';
import { AddressId } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-id';

export abstract class AddressReadRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<Address> | Address[]>;
  abstract getOneById(id: AddressId): Promise<Address | null>;
}
