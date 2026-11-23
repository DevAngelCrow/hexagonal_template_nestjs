import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixPrefix {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value?.trim().toUpperCase(),
      (msg) => new InvalidValueObjectException('DocumentPrefixPrefix', msg),
    )
      .required('Document prefix is required')
      .string('Document prefix must be a string')
      .maxLength(10, 'Document prefix must be at most 10 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: DocumentPrefixPrefix): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

