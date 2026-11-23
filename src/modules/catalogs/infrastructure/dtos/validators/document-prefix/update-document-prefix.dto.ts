import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateDocumentPrefixDto {
  @IsString()
  @IsOptional()
  @MaxLength(10)
  @ApiProperty({
    example: 'DOC',
    description: 'Acrónimo o prefijo impreso del documento',
    required: false,
  })
  prefix?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  @ApiProperty({
    example: 'Serie General de Documentos',
    description: 'Nombre descriptivo del catálogo de serie',
    required: false,
  })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({
    example: 'Prefijo y correlativo genérico para numeración secuencial de documentos',
    required: false,
  })
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  @ApiProperty({
    example: 'ctl_document_prefix',
    description: 'Nombre de la tabla o entidad target',
    required: false,
  })
  entity_target?: string;

  @IsInt()
  @IsOptional()
  @Min(2)
  @Max(10)
  @ApiProperty({
    example: 4,
    description: 'Longitud de ceros a la izquierda (padding)',
    required: false,
  })
  padding?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Si se reinicia anualmente el correlativo',
    required: false,
  })
  reset_yearly?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(5)
  @ApiProperty({
    example: '-',
    description: 'Separador entre prefijo, año y correlativo (ej. -, /, _)',
    required: false,
  })
  separator?: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @ApiProperty({
    example: 10,
    description: 'Valor numérico actual del correlativo',
    required: false,
  })
  current_value?: number;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({
    example: true,
    description: 'Estado activo o inactivo',
    required: false,
  })
  active?: boolean;
}

