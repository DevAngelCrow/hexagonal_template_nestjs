import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixCurrentValue {
  private readonly _value: number;

  constructor(value: number) {
    this._value = Validator.of(
      Number(value),
      (msg) => new InvalidValueObjectException('DocumentPrefixCurrentValue', msg),
    )
      .number('Current value must be a number')
      .min(0, 'Current value cannot be negative')
      .getValue();
  }

  public value(): number {
    return this._value;
  }

  public equals(other: DocumentPrefixCurrentValue): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value.toString();
  }
}

