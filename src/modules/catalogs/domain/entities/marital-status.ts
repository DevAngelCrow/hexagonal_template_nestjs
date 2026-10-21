import { MaritalStatusDescription } from '@/modules/catalogs/domain/value-objects/marital-status-value-object/marital-status-description';
import { MaritalStatusId } from '@/modules/catalogs/domain/value-objects/marital-status-value-object/marital-status-id';
import { MaritalStatusName } from '@/modules/catalogs/domain/value-objects/marital-status-value-object/marital-status-name';

export class MaritalStatus {
  constructor(
    private readonly name: MaritalStatusName,
    private readonly description?: MaritalStatusDescription,
    private readonly id?: MaritalStatusId,
  ) {}
  static create(data: {
    id?: string;
    name: string;
    description?: string;
  }): MaritalStatus {
    return new MaritalStatus(
      new MaritalStatusName(data.name),
      data.description
        ? new MaritalStatusDescription(data.description)
        : undefined,
      data.id ? new MaritalStatusId(data.id) : undefined,
    );
  }

  public getId(): MaritalStatusId | undefined {
    return this.id;
  }
  public getName(): MaritalStatusName {
    return this.name;
  }
  public getDescription(): MaritalStatusDescription | undefined {
    return this.description;
  }
}
