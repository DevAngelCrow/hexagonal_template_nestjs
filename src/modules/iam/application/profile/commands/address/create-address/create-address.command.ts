import { AddressDto } from '@/modules/iam/application/profile/dtos/address.dto';

export class CreateAddressCommand {
  constructor(public readonly address_dto: AddressDto) {}
}
