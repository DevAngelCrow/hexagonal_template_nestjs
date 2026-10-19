import { AddressDto } from '@/modules/iam/application/profile/dtos/address.dto';
import { CreateAddressHandler } from '@/modules/iam/application/profile/commands/address/create-address/create-address.handler';
import { CreateAddressCommand } from '@/modules/iam/application/profile/commands/address/create-address/create-address.command';
export class AddressCreateService {
  constructor(private readonly addressCreateService: CreateAddressHandler) {}
  async run(address_dto: AddressDto): Promise<void> {
    const addressCommand = new CreateAddressCommand(address_dto);
    await this.addressCreateService.execute(addressCommand);
  }
}
