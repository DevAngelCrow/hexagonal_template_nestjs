import { InvalidValueObjectException } from '@/shared/domain/exceptions/invalid-value-object.exeception';
import { Validator } from '@/shared/domain/validators/validator-value-object';

export class PerPage {
  private readonly _value: number;
  constructor(value: number) {
    const createException = (msg: string): InvalidValueObjectException =>
      new InvalidValueObjectException('Per Page', msg);

    this._value = Validator.of(value, createException)
      .required('Per Page is required')
      .number('Per Page must be a number')
      .positiveInteger('Per Page must be a positive integer')
      .max(100, 'Per Page must be less than or equal to 100')
      .getValue();
  }
  public value(): number {
    return this._value;
  }
}
