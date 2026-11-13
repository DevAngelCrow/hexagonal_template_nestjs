import { Injectable } from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '@/shared/infrastructure/persistence/prisma/prisma.service';
import { AddressReadRepository } from '@/modules/iam/application/repositories/address-read.repository';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { EntityList } from '@/shared/domain/value-object/entity-list';
import { TotalItems } from '@/shared/domain/value-object/total-items';
import { TotalPages } from '@/shared/domain/value-object/total-page';
import { Address } from '@/modules/iam/domain/entities/address.entity';
import { AddressId } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-id';
import { AddressStreet } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-street';
import { AddressStreetNumber } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-street-number';
import { AddressNeighborhood } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-neighborhood';
import { AddressIdGeographicDivision } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-id-geographic-division';
import { AddressHouseNumber } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-house-number';
import { AddressBlock } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-block';
import { AddressPathway } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-pathway';
import { AddressCurrent } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-current';
import { AddressIdPeople } from '@/modules/iam/domain/value-objects/profile/address-value-object/address-id-people';

const UNPAGINATED_DEFAULT_TAKE = 100;

@Injectable()
export class ImplAddressReadRepository implements AddressReadRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(
    pagination_params?: PaginationParams,
    filter?: string,
    id_people?: string,
  ): Promise<Pagination<Address> | Address[]> {
    const where: Prisma.mnt_addressWhereInput = {};
    if (id_people) {
      where.id_people = id_people;
    }
    if (filter && filter.trim().length > 0) {
      const term = filter.trim();
      where.OR = [
        { street: { contains: term, mode: 'insensitive' } },
        { neighborhood: { contains: term, mode: 'insensitive' } },
      ];
    }

    const page = pagination_params?.getPage().value();
    const perPage = pagination_params?.getPerPage().value();

    const [addressDb, totalCount] = await Promise.all([
      this.prisma.client.mnt_address.findMany({
        where,
        skip: page && perPage ? (page - 1) * perPage : 0,
        take: perPage ?? UNPAGINATED_DEFAULT_TAKE,
      }),
      pagination_params
        ? this.prisma.client.mnt_address.count({ where })
        : Promise.resolve(0),
    ]);

    const entities = addressDb.map((a) =>
      Address.create({
        id: a.id ? new AddressId(a.id) : null,
        street: new AddressStreet(a.street),
        street_number: new AddressStreetNumber(a.street_number),
        neighborhood: new AddressNeighborhood(a.neighborhood),
        id_geographic_division: new AddressIdGeographicDivision(
          a.id_geographic_division,
        ),
        house_number: new AddressHouseNumber(a.house_number),
        block: new AddressBlock(a.block),
        pathway: new AddressPathway(a.pathway),
        current: new AddressCurrent(a.current),
        id_people: new AddressIdPeople(a.id_people),
      }),
    );

    if (!pagination_params) {
      return entities;
    }

    const perPageValue = pagination_params.getPerPage().value();
    return new Pagination<Address>(
      new EntityList<Address>(entities),
      pagination_params.getPage(),
      pagination_params.getPerPage(),
      new TotalItems(totalCount),
      new TotalPages(Math.ceil(totalCount / perPageValue)),
    );
  }

  async getOneById(id: AddressId): Promise<Address | null> {
    const a = await this.prisma.client.mnt_address.findUnique({
      where: { id: id.value() },
    });
    if (!a) return null;
    return Address.create({
      id: a.id ? new AddressId(a.id) : null,
      street: new AddressStreet(a.street),
      street_number: new AddressStreetNumber(a.street_number),
      neighborhood: new AddressNeighborhood(a.neighborhood),
      id_geographic_division: new AddressIdGeographicDivision(
        a.id_geographic_division,
      ),
      house_number: new AddressHouseNumber(a.house_number),
      block: new AddressBlock(a.block),
      pathway: new AddressPathway(a.pathway),
      current: new AddressCurrent(a.current),
      id_people: new AddressIdPeople(a.id_people),
    });
  }
}
