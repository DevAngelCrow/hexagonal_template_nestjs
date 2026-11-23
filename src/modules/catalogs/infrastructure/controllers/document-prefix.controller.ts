import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SuccessResponseDto } from '@/shared/infrastructure/http/dtos/http-success-response.dto';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';

import { DocumentPrefixHttpDto } from '../dtos/http/document-prefix.http-dto';
import { CreateDocumentPrefixDto } from '../dtos/validators/document-prefix/create-document-prefix.dto';
import { UpdateDocumentPrefixDto } from '../dtos/validators/document-prefix/update-document-prefix.dto';
import { DocumentPrefixDto } from '../../application/dtos/document-prefix.dto';
import { GetDocumentPrefixesQuery } from '../../application/document-prefix/queries/get-document-prefixes/get-document-prefixes.query';
import { GetDocumentPrefixQuery } from '../../application/document-prefix/queries/get-document-prefix/get-document-prefix.query';
import { CreateDocumentPrefixCommand } from '../../application/document-prefix/commands/create-document-prefix/create-document-prefix.command';
import { UpdateDocumentPrefixCommand } from '../../application/document-prefix/commands/update-document-prefix/update-document-prefix.command';
import { ToggleStatusDocumentPrefixCommand } from '../../application/document-prefix/commands/toggle-status-document-prefix/toggle-status-document-prefix.command';

@ApiTags('Catálogos')
@ApiBearerAuth('JWT-auth')
@Controller('document-prefixes')
export class DocumentPrefixController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Permissions('listar-prefijos-documentos', 'listar-catalogos')
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar catálogo de prefijos y series de documentos del sistema',
    description:
      'Devuelve todos los prefijos registrados (ej. DOC) con su estado, correlativo actual y próximo número proyectado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de prefijos obtenido exitosamente',
    type: [DocumentPrefixHttpDto],
  })
  async getAll(): Promise<SuccessResponseDto<DocumentPrefixHttpDto[]>> {
    const items: DocumentPrefixDto[] = await this.queryBus.execute(
      new GetDocumentPrefixesQuery(),
    );

    const httpItems = items.map((p) => this.toHttpDto(p));

    return new SuccessResponseDto<DocumentPrefixHttpDto[]>(
      httpItems,
      HttpStatus.OK,
      'Document prefixes retrieved successfully',
    );
  }

  @Permissions('crear-prefijo-documento', 'listar-catalogos')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva serie o prefijo de documento',
    description:
      'Registra un nuevo prefijo y formato de serie correlativa para documentos del sistema.',
  })
  @ApiResponse({
    status: 201,
    description: 'Prefijo creado exitosamente',
    type: DocumentPrefixHttpDto,
  })
  async create(
    @Body() dto: CreateDocumentPrefixDto,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const created: DocumentPrefixDto = await this.commandBus.execute(
      new CreateDocumentPrefixCommand(dto),
    );

    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      this.toHttpDto(created),
      HttpStatus.CREATED,
      'Prefijo de documento creado exitosamente',
    );
  }

  @Permissions('editar-prefijo-documento', 'listar-catalogos')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar configuración de un prefijo de documento',
    description:
      'Permite editar prefijo, nombre, descripción, padding, separador, reinicio anual o correlativo actual.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) o código del prefijo',
  })
  @ApiResponse({
    status: 200,
    description: 'Prefijo actualizado exitosamente',
    type: DocumentPrefixHttpDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentPrefixDto,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const updated: DocumentPrefixDto = await this.commandBus.execute(
      new UpdateDocumentPrefixCommand(id, dto),
    );

    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      this.toHttpDto(updated),
      HttpStatus.OK,
      'Prefijo de documento actualizado exitosamente',
    );
  }

  @Permissions('eliminar-prefijo-documento', 'editar-prefijo-documento', 'listar-catalogos')
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Alternar estado activo/inactivo de un prefijo de documento',
  })
  @ApiParam({
    name: 'id',
    description: 'ID (UUID) o código del prefijo',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado del prefijo modificado',
    type: DocumentPrefixHttpDto,
  })
  async toggleStatus(
    @Param('id') id: string,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const updated: DocumentPrefixDto = await this.commandBus.execute(
      new ToggleStatusDocumentPrefixCommand(id),
    );

    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      this.toHttpDto(updated),
      HttpStatus.OK,
      `Prefijo de documento ${updated.active ? 'activado' : 'desactivado'} exitosamente`,
    );
  }

  @Permissions('ver-prefijo-documento', 'listar-prefijos-documentos', 'listar-catalogos')
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Consultar información de un prefijo por su código o ID',
  })
  @ApiParam({
    name: 'code',
    description: 'Código del prefijo (ej. DOCUMENT) o UUID',
    example: 'DOCUMENT',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del prefijo',
    type: DocumentPrefixHttpDto,
  })
  async getByCode(
    @Param('code') code: string,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const item: DocumentPrefixDto = await this.queryBus.execute(
      new GetDocumentPrefixQuery(code),
    );

    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      this.toHttpDto(item),
      HttpStatus.OK,
      'Document prefix retrieved successfully',
    );
  }

  private toHttpDto(dto: DocumentPrefixDto): DocumentPrefixHttpDto {
    return new DocumentPrefixHttpDto({
      id: dto.id,
      code: dto.code,
      prefix: dto.prefix,
      name: dto.name,
      description: dto.description,
      entity_target: dto.entity_target,
      current_year: dto.current_year,
      current_value: dto.current_value,
      padding: dto.padding,
      reset_yearly: dto.reset_yearly,
      separator: dto.separator,
      next_preview: dto.next_preview ?? '',
      active: dto.active,
      status: dto.status,
    });
  }
}
