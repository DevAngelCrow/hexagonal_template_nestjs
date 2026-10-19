import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { GetPersonByEmailHandler } from '@/modules/iam/application/profile/queries/person/get-person-by-email/get-person-by-email.handler';
import { GetPersonByEmailQuery } from '@/modules/iam/application/profile/queries/person/get-person-by-email/get-person-by-email.query';
export class PersonGetOneByEmailService {
  constructor(private readonly personGetOneByEmail: GetPersonByEmailHandler) {}
  async run(email: string): Promise<Person | null> {
    const personQuery = new GetPersonByEmailQuery(email);
    return await this.personGetOneByEmail.execute(personQuery);
  }
}
