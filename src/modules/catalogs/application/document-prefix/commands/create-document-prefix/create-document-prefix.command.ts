export class CreateDocumentPrefixCommand {
  constructor(
    public readonly dto: {
      code: string;
      prefix: string;
      name: string;
      description?: string | null;
      entity_target: string;
      padding?: number;
      reset_yearly?: boolean;
      separator?: string;
      current_value?: number;
      active?: boolean;
    },
  ) {}
}

