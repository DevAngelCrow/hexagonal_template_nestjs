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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { SequenceGeneratorPort } from '@/shared/application/ports/sequence-generator.port';
import { SuccessResponseDto } from '@/shared/infrastructure/http/dtos/http-success-response.dto';
import { DocumentPrefixHttpDto } from '../dtos/http/document-prefix.http-dto';
import { CreateDocumentPrefixDto } from '../dtos/validators/document-prefix/create-document-prefix.dto';
import { UpdateDocumentPrefixDto } from '../dtos/validators/document-prefix/update-document-prefix.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { GetBooleanStatusCatalogService } from '@/shared/infrastructure/services/get-status-catalog.service';
import { StatusMapperUtil } from '@/shared/infrastructure/utils/status-mapper.util';
import { BooleanStatusData } from '@/shared/infrastructure/interfaces/boolean-status-data.interface';
import { GlobalStatusDto } from '@/shared/application/dtos/global-status.dto';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('Catálogos')
@ApiBearerAuth('JWT-auth')
@Controller('document-prefixes')
export class DocumentPrefixController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sequenceGenerator: SequenceGeneratorPort,
  ) {}

  @Permissions('listar-prefijos-documentos', 'listar-catalogos')
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar catálogo de prefijos y series de documentos del sistema',
    description:
      'Devuelve todos los prefijos registrados (ej. RES, FAC, PAY) con su estado, correlativo actual y próximo número proyectado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de prefijos obtenido exitosamente',
    type: [DocumentPrefixHttpDto],
  })
  async getAll(): Promise<SuccessResponseDto<DocumentPrefixHttpDto[]>> {
    const [prefixes, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.findMany({
        where: { deleted_at: null },
        orderBy: { name: 'asc' },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    const items: DocumentPrefixHttpDto[] = await Promise.all(
      prefixes.map((p) => this.toHttpDto(p, catalogStatus)),
    );

    return new SuccessResponseDto<DocumentPrefixHttpDto[]>(
      items,
      HttpStatus.OK,
      'Document prefixes retrieved successfully',
    );
  }

  @Permissions('crear-prefijo-documento', 'listar-catalogos')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una nueva serie o prefijo de documento',
    description: 'Registra un nuevo prefijo y formato de serie correlativa para documentos del sistema.',
  })
  @ApiResponse({
    status: 201,
    description: 'Prefijo creado exitosamente',
    type: DocumentPrefixHttpDto,
  })
  async create(
    @Body() dto: CreateDocumentPrefixDto,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedPrefix = dto.prefix.trim().toUpperCase();

    const existingCode = await this.prisma.client.ctl_document_prefix.findFirst({
      where: { code: normalizedCode, deleted_at: null },
    });
    if (existingCode) {
      throw new ConflictException(`Ya existe una serie de documento con el código '${normalizedCode}'`);
    }

    const existingPrefix = await this.prisma.client.ctl_document_prefix.findFirst({
      where: { prefix: normalizedPrefix, deleted_at: null },
    });
    if (existingPrefix) {
      throw new ConflictException(`Ya existe una serie de documento con el prefijo '${normalizedPrefix}'`);
    }

    const currentYear = dto.reset_yearly !== false ? new Date().getFullYear() : null;

    const [created, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.create({
        data: {
          code: normalizedCode,
          prefix: normalizedPrefix,
          name: dto.name.trim(),
          description: dto.description?.trim() || null,
          entity_target: dto.entity_target.trim(),
          padding: dto.padding ?? 4,
          reset_yearly: dto.reset_yearly ?? true,
          separator: dto.separator?.trim() || '-',
          current_value: dto.current_value ?? 0,
          current_year: currentYear,
          active: dto.active ?? true,
        },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    const httpDto = await this.toHttpDto(created, catalogStatus);
    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      httpDto,
      HttpStatus.CREATED,
      'Prefijo de documento creado exitosamente',
    );
  }

  @Permissions('editar-prefijo-documento', 'listar-catalogos')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Actualizar configuración de un prefijo de documento',
    description: 'Permite editar prefijo, nombre, descripción, padding, separador, reinicio anual o correlativo actual.',
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
    const existing = await this.findByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('DocumentPrefix', id);
    }

    let normalizedPrefix = existing.prefix;
    if (dto.prefix) {
      normalizedPrefix = dto.prefix.trim().toUpperCase();
      const prefixConflict = await this.prisma.client.ctl_document_prefix.findFirst({
        where: {
          prefix: normalizedPrefix,
          id: { not: existing.id },
          deleted_at: null,
        },
      });
      if (prefixConflict) {
        throw new ConflictException(`El prefijo '${normalizedPrefix}' ya está en uso por la serie '${prefixConflict.name}'.`);
      }
    }

    const [updated, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.update({
        where: { id: existing.id },
        data: {
          ...(dto.prefix !== undefined ? { prefix: normalizedPrefix } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
          ...(dto.entity_target !== undefined ? { entity_target: dto.entity_target.trim() } : {}),
          ...(dto.padding !== undefined ? { padding: dto.padding } : {}),
          ...(dto.reset_yearly !== undefined ? { reset_yearly: dto.reset_yearly } : {}),
          ...(dto.separator !== undefined ? { separator: dto.separator.trim() } : {}),
          ...(dto.current_value !== undefined ? { current_value: dto.current_value } : {}),
          ...(dto.active !== undefined ? { active: dto.active } : {}),
        },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    const httpDto = await this.toHttpDto(updated, catalogStatus);
    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      httpDto,
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
    const existing = await this.findByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('DocumentPrefix', id);
    }

    const [updated, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_document_prefix.update({
        where: { id: existing.id },
        data: {
          active: !existing.active,
        },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    const httpDto = await this.toHttpDto(updated, catalogStatus);
    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      httpDto,
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
    description: 'Código del prefijo (ej. RESERVATION, INVOICE) o UUID',
    example: 'RESERVATION',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle del prefijo',
    type: DocumentPrefixHttpDto,
  })
  async getByCode(
    @Param('code') code: string,
  ): Promise<SuccessResponseDto<DocumentPrefixHttpDto>> {
    const [p, catalogStatus] = await Promise.all([
      this.findByIdOrCode(code),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    if (!p) {
      throw new NotFoundException('DocumentPrefix', code);
    }

    const dto = await this.toHttpDto(p, catalogStatus);

    return new SuccessResponseDto<DocumentPrefixHttpDto>(
      dto,
      HttpStatus.OK,
      'Document prefix retrieved successfully',
    );
  }

  private async findByIdOrCode(identifier: string) {
    const isUuid = UUID_REGEX.test(identifier);
    return this.prisma.client.ctl_document_prefix.findFirst({
      where: isUuid
        ? { id: identifier, deleted_at: null }
        : { code: identifier.toUpperCase(), deleted_at: null },
    });
  }

  private async toHttpDto(
    p: any,
    catalogStatus?: Map<string, BooleanStatusData>,
  ): Promise<DocumentPrefixHttpDto> {
    let nextPreview = '';
    try {
      nextPreview = await this.sequenceGenerator.peek(p.code);
    } catch {
      const year = p.reset_yearly ? (p.current_year || new Date().getFullYear()) : null;
      const nextVal = (p.current_value || 0) + 1;
      const padded = String(nextVal).padStart(p.padding, '0');
      nextPreview = year
        ? `${p.prefix}${p.separator}${year}${p.separator}${padded}`
        : `${p.prefix}${p.separator}${padded}`;
    }

    let status: GlobalStatusDto | undefined = undefined;
    if (catalogStatus) {
      try {
        status = StatusMapperUtil.getStatusFromBoolean(
          p.active,
          catalogStatus,
          'toHttpDto',
        );
      } catch {
        status = undefined;
      }
    }

    return new DocumentPrefixHttpDto({
      id: p.id,
      code: p.code,
      prefix: p.prefix,
      name: p.name,
      description: p.description,
      entity_target: p.entity_target,
      current_year: p.current_year,
      current_value: p.current_value,
      padding: p.padding,
      reset_yearly: p.reset_yearly,
      separator: p.separator,
      next_preview: nextPreview,
      active: p.active,
      status,
    });
  }
}
