import { Person } from '@/modules/iam/domain/aggregates/person.aggregate';
import { PersonDto } from '@/modules/iam/application/profile/dtos/person.dto';
import { CreatePersonCommand } from '@/modules/iam/application/profile/commands/person/create-person/create-person.command';
import { UpdatePersonHandler } from '@/modules/iam/application/profile/commands/person/update-person/update-person.handler';
export class PersonUpdateService {
  constructor(private readonly personUpdate: UpdatePersonHandler) {}
  async run(person_dto: PersonDto): Promise<Person | void> {
    const personCommand = new CreatePersonCommand(person_dto);
    return await this.personUpdate.execute(personCommand);
  }
}
