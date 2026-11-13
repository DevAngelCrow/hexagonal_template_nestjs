export class ConfirmEmailChangeCommand {
  constructor(
    public readonly id: string,
    public readonly token: string,
  ) {}
}

