import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exeception';
import { Validator } from '@/shared/domain/validators/validator-value-object';

export class Page {
  private readonly _value: number;
  constructor(value: number) {
    const createException = (msg: string): InvalidValueObjectException =>
      new InvalidValueObjectException('Page', msg);
    this._value = Validator.of(value, createException)
      .required('Page is required')
      .number('Page must be a number')
      .positiveInteger('Page must be a positive integer')
      .getValue();
  }
  public value(): number {
    return this._value;
  }
}
