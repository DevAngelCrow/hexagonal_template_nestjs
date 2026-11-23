import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateDocumentPrefixDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty({
    example: 'DOCUMENT',
    description: 'Código programático único del prefijo (en mayúsculas)',
  })
  code!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  @ApiProperty({
    example: 'DOC',
    description: 'Acrónimo o prefijo impreso del documento',
  })
  prefix!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    example: 'Serie General de Documentos',
    description: 'Nombre descriptivo del catálogo de serie',
  })
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({
    example: 'Prefijo y correlativo genérico para numeración secuencial de documentos',
    required: false,
  })
  description?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @ApiProperty({
    example: 'ctl_document_prefix',
    description: 'Nombre de la tabla o entidad target',
  })
  entity_target!: string;

  @IsInt()
  @IsOptional()
  @Min(2)
  @Max(10)
  @ApiProperty({
    example: 4,
    description: 'Longitud de ceros a la izquierda (padding)',
    default: 4,
    required: false,
  })
  padding?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Si se reinicia anualmente el correlativo',
    default: true,
    required: false,
  })
  reset_yearly?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  @ApiProperty({
    example: '-',
    description: 'Separador entre prefijo, año y correlativo (ej. -, /, _)',
    default: '-',
    required: false,
  })
  separator?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    example: 0,
    description: 'Valor inicial del correlativo (por defecto 0)',
    default: 0,
    required: false,
  })
  current_value?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Estado activo o inactivo',
    default: true,
    required: false,
  })
  active?: boolean;
}

