import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exeception';
import { Validator } from '@/shared/domain/validators/validator-value-object';

export class TotalItems {
  private readonly _value: number;
  constructor(value: number) {
    const createException = (msg: string): InvalidValueObjectException =>
      new InvalidValueObjectException('Total Items', msg);
    this._value = Validator.of(value, createException)
      .required('Total Items is required')
      .number('Total Items must be a number')
      //.positiveInteger('Total Items must be a positive integer')
      .getValue();
  }
  public value(): number {
    return this._value;
  }
}
