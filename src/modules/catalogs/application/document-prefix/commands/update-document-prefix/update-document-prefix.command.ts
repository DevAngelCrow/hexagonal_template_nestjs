export class UpdateDocumentPrefixCommand {
  constructor(
    public readonly id: string,
    public readonly dto: {
      prefix?: string;
      name?: string;
      description?: string | null;
      entity_target?: string;
      padding?: number;
      reset_yearly?: boolean;
      separator?: string;
      current_value?: number;
      active?: boolean;
    },
  ) {}
}

