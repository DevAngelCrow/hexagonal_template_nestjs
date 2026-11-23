import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixPadding {
  private readonly _value: number;

  constructor(value: number) {
    this._value = Validator.of(
      Number(value),
      (msg) => new InvalidValueObjectException('DocumentPrefixPadding', msg),
    )
      .number('Padding must be a number')
      .min(1, 'Padding must be at least 1')
      .max(10, 'Padding must be at most 10')
      .getValue();
  }

  public value(): number {
    return this._value;
  }

  public equals(other: DocumentPrefixPadding): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value.toString();
  }
}

