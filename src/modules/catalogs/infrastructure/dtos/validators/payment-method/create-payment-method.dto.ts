import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  @ApiProperty({
    example: 'CASH',
    description: 'Código único en mayúsculas del método de pago (máx. 20 caracteres)',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    example: 'Efectivo',
    description: 'Nombre descriptivo del método de pago',
  })
  name!: string;

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
    description: 'Estado inicial activo/inactivo',
    default: true,
  })
  active?: boolean;
}

