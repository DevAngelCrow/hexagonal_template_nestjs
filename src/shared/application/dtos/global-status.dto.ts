export class GlobalStatusDto<T = unknown> {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly code: string,
    public readonly active: boolean,
    public readonly state_color: string,
    public readonly text_color: string,
    public readonly id_category_status: string,
    public readonly id?: string,
    public readonly category_status?: T,
  ) {}

  public static fromDto<T>(dto: GlobalStatusDto<T>): GlobalStatusDto<T> {
    return new GlobalStatusDto(
      dto.name,
      dto.description,
      dto.code,
      dto.active,
      dto.state_color,
      dto.text_color,
      dto.id_category_status,
      dto.id,
      dto.category_status,
    );
  }
}
