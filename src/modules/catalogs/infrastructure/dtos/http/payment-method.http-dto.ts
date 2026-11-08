import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

export class PaymentMethodHttpDto {
  @ApiProperty({ description: 'UUID único del método de pago' })
  id!: string;

  @ApiProperty({ description: 'Código único en mayúsculas (ej. CASH, TRANSFER, CARD)' })
  code!: string;

  @ApiProperty({ description: 'Nombre legible del método de pago' })
  name!: string;

  @ApiPropertyOptional({ description: 'Descripción detallada opcional' })
  description?: string | null;

  @ApiProperty({ description: 'Estado activo o inactivo' })
  active!: boolean;

  @ApiPropertyOptional({ type: () => GlobalStatusDto, description: 'Estado global mapeado' })
  status?: GlobalStatusDto;

  @ApiPropertyOptional({ description: 'Fecha de creación' })
  created_at?: Date | null;

  @ApiPropertyOptional({ description: 'Fecha de última actualización' })
  updated_at?: Date | null;
}

