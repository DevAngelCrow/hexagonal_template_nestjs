export class RequestEmailChangeCommand {
  constructor(
    public readonly user_id: string,
    public readonly current_password: string,
    public readonly new_email: string,
  ) {}
}

