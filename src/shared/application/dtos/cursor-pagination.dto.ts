const DEFAULT_LIMIT = 20;

export class CursorPaginationParamsDto {
  cursor?: string;
  limit: number = DEFAULT_LIMIT;

  constructor(cursor?: string, limit?: number) {
    if (cursor !== undefined) this.cursor = cursor;
    if (limit !== undefined) this.limit = limit;
  }
}

