import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixName {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value?.trim(),
      (msg) => new InvalidValueObjectException('DocumentPrefixName', msg),
    )
      .required('Document prefix name is required')
      .string('Document prefix name must be a string')
      .maxLength(100, 'Document prefix name must be at most 100 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: DocumentPrefixName): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

