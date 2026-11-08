import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class CountryPhoneMask {
  private readonly _value?: string;

  constructor(value?: string | null) {
    if (value === undefined || value === null || value === '') {
      this._value = undefined;
      return;
    }
    this._value = Validator.of(
      value,
      (msg) => new InvalidValueObjectException('CountryPhoneMask', msg),
    )
      .string('Country phone mask must be a string')
      .maxLength(50, 'Country phone mask must be at most 50 characters long')
      .getValue();
  }

  public value(): string | undefined {
    return this._value;
  }

  public toString(): string {
    return this._value ?? '';
  }
}

