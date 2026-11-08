import { CountryAbbreviation } from '@/modules/catalogs/domain/value-objects/country-value-object/contry-abbreviation';
import { CountryActive } from '@/modules/catalogs/domain/value-objects/country-value-object/country-active';
import { CountryCode } from '@/modules/catalogs/domain/value-objects/country-value-object/country-code';
import { CountryId } from '@/modules/catalogs/domain/value-objects/country-value-object/country-id';
import { CountryName } from '@/modules/catalogs/domain/value-objects/country-value-object/country-name';
import { CountryIso2 } from '@/modules/catalogs/domain/value-objects/country-value-object/country-iso2';
import { CountryPhoneCode } from '@/modules/catalogs/domain/value-objects/country-value-object/country-phone-code';
import { CountryPhoneMask } from '@/modules/catalogs/domain/value-objects/country-value-object/country-phone-mask';

export class Country {
  constructor(
    private readonly name: CountryName,
    private readonly iso2: CountryIso2,
    private readonly abbreviation: CountryAbbreviation,
    private readonly code: CountryCode,
    private readonly phone_code: CountryPhoneCode,
    private readonly active: CountryActive,
    private readonly id?: CountryId,
    private readonly phone_mask?: CountryPhoneMask,
  ) {}
  static create(data: {
    id?: string;
    name: string;
    abbreviation: string;
    code: string;
    active: boolean;
    iso2: string;
    phone_code: string;
    phone_mask?: string | null;
  }): Country {
    return new Country(
      new CountryName(data.name),
      new CountryIso2(data.iso2),
      new CountryAbbreviation(data.abbreviation),
      new CountryCode(data.code),
      new CountryPhoneCode(data.phone_code),
      new CountryActive(data.active),
      data.id ? new CountryId(data.id) : undefined,
      new CountryPhoneMask(data.phone_mask),
    );
  }
  public getId(): CountryId | undefined {
    return this.id;
  }
  public getName(): CountryName {
    return this.name;
  }
  public getAbbreviation(): CountryAbbreviation {
    return this.abbreviation;
  }
  public getCode(): CountryCode {
    return this.code;
  }
  public getActive(): CountryActive {
    return this.active;
  }
  public getIso2(): CountryIso2 {
    return this.iso2;
  }
  public getPhoneCode(): CountryPhoneCode {
    return this.phone_code;
  }
  public getPhoneMask(): CountryPhoneMask | undefined {
    return this.phone_mask;
  }
}
