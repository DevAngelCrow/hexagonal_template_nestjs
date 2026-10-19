import { AddressDto } from '@/modules/iam/application/profile/dtos/address.dto';
import { UpdateAddressHandler } from '@/modules/iam/application/profile/commands/address/update-address/update-address.handler';
import { UpdateAddressCommand } from '@/modules/iam/application/profile/commands/address/update-address/update-address.command';
export class AddressUpdateService {
  constructor(private readonly addressUpdateService: UpdateAddressHandler) {}
  async run(address_dto: AddressDto): Promise<void> {
    const addressCommand = new UpdateAddressCommand(address_dto);
    return await this.addressUpdateService.execute(addressCommand);
  }
}
