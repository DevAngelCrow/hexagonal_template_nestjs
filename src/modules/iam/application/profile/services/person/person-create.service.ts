import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { PersonDto } from '@/modules/iam/application/profile/dtos/person.dto';
import { CreatePersonHandler } from '@/modules/iam/application/profile/commands/person/create-person/create-person.handler';
import { CreatePersonCommand } from '@/modules/iam/application/profile/commands/person/create-person/create-person.command';
export class PersonCreateService {
  constructor(private readonly personCreate: CreatePersonHandler) {}
  async run(person_dto: PersonDto): Promise<Person | void> {
    const personCommand = new CreatePersonCommand(person_dto);
    return await this.personCreate.execute(personCommand);
  }
}
