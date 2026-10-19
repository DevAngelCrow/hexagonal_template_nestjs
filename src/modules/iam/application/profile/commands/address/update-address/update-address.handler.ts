import { PersonRepository } from '@/modules/iam/domain/repositories/person.repository';
import { UpdateAddressCommand } from '@/modules/iam/application/profile/commands/address/update-address/update-address.command';
import { Address } from '@/modules/iam/domain/entities/address.entity';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { PersonId } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-id';
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
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';

@CommandHandler(UpdateAddressCommand)
export class UpdateAddressHandler implements ICommandHandler<UpdateAddressCommand> {
  constructor(
    private readonly repository: PersonRepository,
    private readonly dispatcher: EventDispatcherPort,
  ) {}

  async execute(command: UpdateAddressCommand): Promise<void> {
    const personId = new PersonId(command.address_dto.id_people);
    const personEntity = await this.repository.findById(personId);

    if (!personEntity) {
      throw new NotFoundException('Person', command.address_dto.id_people);
    }

    const address = Address.create({
      id: command.address_dto.id ? new AddressId(command.address_dto.id) : null,
      street: new AddressStreet(command.address_dto.street),
      street_number: new AddressStreetNumber(command.address_dto.street_number),
      neighborhood: new AddressNeighborhood(command.address_dto.neighborhood),
      id_geographic_division: new AddressIdGeographicDivision(
        command.address_dto.id_geographic_division,
      ),
      house_number: new AddressHouseNumber(command.address_dto.house_number),
      block: new AddressBlock(command.address_dto.block),
      pathway: new AddressPathway(command.address_dto.pathway),
      current: new AddressCurrent(command.address_dto.current),
      id_people: new AddressIdPeople(command.address_dto.id_people),
    });
    if (!command.address_dto.id) {
      throw new BadRequestException('Address ID is required for update');
    }
    personEntity.updateAddress(command.address_dto.id, address);

    await this.repository.update(personEntity);
    await this.dispatcher.dispatch(personEntity.getDomainEvents());
    personEntity.clearDomainEvents();
  }
}
