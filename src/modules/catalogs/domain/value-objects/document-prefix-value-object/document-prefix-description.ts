import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exception';
import { Validator } from '@/shared/domain/validator/validator-value-object';

export class DocumentPrefixDescription {
  private readonly _value?: string;

  constructor(value?: string | null) {
    if (value === undefined || value === null || value === '') {
      this._value = undefined;
      return;
    }
    this._value = Validator.of(
      value.trim(),
      (msg) => new InvalidValueObjectException('DocumentPrefixDescription', msg),
    )
      .string('Document prefix description must be a string')
      .maxLength(255, 'Document prefix description must be at most 255 characters long')
      .getValue();
  }

  public value(): string | undefined {
    return this._value;
  }

  public equals(other: DocumentPrefixDescription): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value ?? '';
  }
}

