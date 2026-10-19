import { Pagination } from '@/shared/domain/value-object/pagination';
import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { PersonId } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-id';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';

export abstract class PersonRepository {
  abstract create(
    person: Person,
    nationalities: string[],
  ): Promise<Person | void>;
  abstract update(person: Person, nationalities?: string[]): Promise<void>;
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<Person> | Person[]>;
  abstract findById(id: PersonId): Promise<Person | null>;
  abstract findByDocumentId(documentId: string): Promise<Person | null>;
  abstract findByAddressId(addressId: string): Promise<Person | null>;
  abstract getOneByEmail(email: PersonEmail): Promise<Person | null>;
  abstract delete(id: PersonId): Promise<void>;
}
