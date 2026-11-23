import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

export class DocumentPrefixDto {
  id: string;
  code: string;
  prefix: string;
  name: string;
  description?: string | null;
  entity_target: string;
  current_year?: number | null;
  current_value: number;
  padding: number;
  reset_yearly: boolean;
  separator: string;
  next_preview?: string;
  active: boolean;
  status?: GlobalStatusDto;
  created_at?: Date | null;
  updated_at?: Date | null;

  constructor(partial: Partial<DocumentPrefixDto>) {
    Object.assign(this, partial);
  }
}

