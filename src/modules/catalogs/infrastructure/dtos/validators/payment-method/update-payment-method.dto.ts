import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePaymentMethodDto {
  @IsString()
  @IsOptional()
  @MaxLength(20)
  @ApiPropertyOptional({
    example: 'CASH',
    description: 'Código único en mayúsculas del método de pago (máx. 20 caracteres)',
  })
  code?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiPropertyOptional({
    example: 'Efectivo',
    description: 'Nombre descriptivo del método de pago',
  })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiPropertyOptional({
    example: 'Pago en efectivo en moneda de curso legal',
    description: 'Descripción explicativa del método de pago',
  })
  description?: string;

  @IsBoolean()
  @IsOptional()
  @ApiPropertyOptional({
    example: true,
    description: 'Estado activo o inactivo',
  })
  active?: boolean;
}

