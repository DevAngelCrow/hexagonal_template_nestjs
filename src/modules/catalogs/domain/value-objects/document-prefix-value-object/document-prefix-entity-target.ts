import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixEntityTarget {
  private readonly _value: string;

  constructor(value: string) {
    this._value = Validator.of(
      value?.trim(),
      (msg) => new InvalidValueObjectException('DocumentPrefixEntityTarget', msg),
    )
      .required('Document prefix entity target is required')
      .string('Document prefix entity target must be a string')
      .maxLength(50, 'Document prefix entity target must be at most 50 characters long')
      .getValue();
  }

  public value(): string {
    return this._value;
  }

  public equals(other: DocumentPrefixEntityTarget): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}

