export class InfrastructureException extends Error {
  constructor(
    public readonly message: string = 'Infrastructure exception occurred',
    public readonly code: string,
    public readonly errorCode?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
