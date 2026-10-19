import { AddressDto } from '@/modules/iam/application/profile/dtos/address.dto';

export class UpdateAddressCommand {
  constructor(public readonly address_dto: AddressDto) {}
}
