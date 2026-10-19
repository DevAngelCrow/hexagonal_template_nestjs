import { PersonDto } from '@/modules/iam/application/profile/dtos/person.dto';

export class CreatePersonCommand {
  constructor(public readonly person_dto: PersonDto) {}
}
