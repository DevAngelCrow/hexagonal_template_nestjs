import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixCurrentYear {
  private readonly _value?: number | null;

  constructor(value?: number | null) {
    if (value === undefined || value === null) {
      this._value = null;
      return;
    }
    this._value = Validator.of(
      Number(value),
      (msg) => new InvalidValueObjectException('DocumentPrefixCurrentYear', msg),
    )
      .number('Current year must be a number')
      .min(2000, 'Current year must be at least 2000')
      .getValue();
  }

  public value(): number | null | undefined {
    return this._value;
  }

  public equals(other: DocumentPrefixCurrentYear): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value ? this._value.toString() : '';
  }
}

