import { Pagination } from '@/shared/domain/value-object/pagination';
import { PaginationParams } from '@/shared/domain/value-object/pagination-params';
import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { AuthenticateProfileDto } from '@/modules/iam/application/auth/dtos/authenticate-profile.dto';

export abstract class PersonReadRepository {
  abstract getAll(
    pagination_params?: PaginationParams,
    filter?: string,
  ): Promise<Pagination<Person> | Person[]>;
  abstract getOneByIdProfile(
    id_user: string,
  ): Promise<AuthenticateProfileDto | null>;
  abstract getOneByEmail(email: PersonEmail): Promise<Person | null>;
}
