export class RouteStatusToggledEvent {
  constructor(
    public readonly newStatus: boolean,
    public readonly id?: string,
  ) {}
}
