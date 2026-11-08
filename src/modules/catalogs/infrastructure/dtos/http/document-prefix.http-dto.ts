import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

export class DocumentPrefixHttpDto {
  @ApiProperty({ example: 'b0e5adcf-87eb-4fb9-a7d5-d224213dc888' })
  id: string;

  @ApiProperty({ example: 'RESERVATION' })
  code: string;

  @ApiProperty({ example: 'RES' })
  prefix: string;

  @ApiProperty({ example: 'Serie de Reservas' })
  name: string;

  @ApiProperty({
    example: 'Prefijo y correlativo para contratos y órdenes de reserva de inventario',
    nullable: true,
  })
  description?: string | null;

  @ApiProperty({ example: 'mnt_reservation' })
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

  @ApiProperty({ example: 'RES-2026-0006' })
  next_preview: string;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiPropertyOptional({ type: () => GlobalStatusDto, description: 'Estado global mapeado' })
  status?: GlobalStatusDto;

  constructor(partial: Partial<DocumentPrefixHttpDto>) {
    Object.assign(this, partial);
  }
}

