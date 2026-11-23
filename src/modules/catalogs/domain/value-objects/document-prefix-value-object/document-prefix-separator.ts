import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixSeparator {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value?.trim(),
      (msg) => new InvalidValueObjectException('DocumentPrefixSeparator', msg),
    )
      .required('Separator is required')
      .string('Separator must be a string')
      .maxLength(5, 'Separator must be at most 5 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: DocumentPrefixSeparator): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

