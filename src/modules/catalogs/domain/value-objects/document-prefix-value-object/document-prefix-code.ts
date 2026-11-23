import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixCode {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value?.trim().toUpperCase(),
      (msg) => new InvalidValueObjectException('DocumentPrefixCode', msg),
    )
      .required('Document prefix code is required')
      .string('Document prefix code must be a string')
      .maxLength(50, 'Document prefix code must be at most 50 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: DocumentPrefixCode): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

