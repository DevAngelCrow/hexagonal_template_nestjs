import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exeception';
import { Validator } from '@/shared/domain/validators/validator-value-object';

export class TotalPages {
  private readonly _value: number;
  constructor(value: number) {
    const createException = (msg: string): InvalidValueObjectException =>
      new InvalidValueObjectException('Total Pages', msg);

    this._value = Validator.of(value, createException)
      .required('Total Pages is required')
      .number('Total Pages must be a number')
      //.positiveInteger('Total Pages must be a positive integer')
      .getValue();
  }
  public value(): number {
    return this._value;
  }
}
