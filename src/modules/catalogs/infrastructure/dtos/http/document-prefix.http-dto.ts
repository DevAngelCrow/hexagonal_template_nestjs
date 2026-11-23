import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

export class DocumentPrefixHttpDto {
  @ApiProperty({ example: 'b0e5adcf-87eb-4fb9-a7d5-d224213dc888' })
  id: string;

  @ApiProperty({ example: 'DOCUMENT' })
  code: string;

  @ApiProperty({ example: 'DOC' })
  prefix: string;

  @ApiProperty({ example: 'Serie General de Documentos' })
  name: string;

  @ApiProperty({
    example: 'Prefijo y correlativo genérico configurable para numeración secuencial de documentos',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({ example: 'ctl_document_prefix' })
  entity_target: string;

  @ApiProperty({ example: 2026, nullable: true })
  current_year?: number | null;

  @ApiProperty({ example: 5 })
  current_value: number;

  @ApiProperty({ example: 4 })
  padding: number;

  @ApiProperty({ example: true })
  reset_yearly: boolean;

  @ApiProperty({ example: '-' })
  separator: string;

  @ApiProperty({ example: 'DOC-2026-0006' })
  next_preview: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiPropertyOptional({ type: () => GlobalStatusDto, description: 'Estado global mapeado' })
  status?: GlobalStatusDto;

  constructor(partial: Partial<DocumentPrefixHttpDto>) {
    Object.assign(this, partial);
  }
}

