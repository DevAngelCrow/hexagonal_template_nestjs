import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { SuccessResponseDto } from '@/shared/infrastructure/http/dtos/http-success-response.dto';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';

import { PaymentMethodHttpDto } from '../dtos/http/payment-method.http-dto';
import { CreatePaymentMethodDto } from '../dtos/validators/payment-method/create-payment-method.dto';
import { UpdatePaymentMethodDto } from '../dtos/validators/payment-method/update-payment-method.dto';
import { GetBooleanStatusCatalogService } from '@/shared/infrastructure/services/get-status-catalog.service';
import { StatusMapperUtil } from '@/shared/infrastructure/utils/status-mapper.util';
import { BooleanStatusData } from '@/shared/infrastructure/interfaces/boolean-status-data.interface';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@ApiTags('Catálogos - Métodos de Pago')
@ApiBearerAuth('JWT-auth')
@Controller('payment-methods')
export class PaymentMethodController {
  constructor(private readonly prisma: PrismaService) {}

  @Permissions('listar-metodos-pago', 'listar-catalogos', 'registrar-pago', 'listar-pagos')
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar catálogo de métodos de pago' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por código, nombre o descripción' })
  @ApiQuery({ name: 'active', required: false, type: Boolean, description: 'Filtrar por estado activo' })
  @ApiResponse({
    status: 200,
    description: 'Listado de métodos de pago obtenido exitosamente',
    type: [PaymentMethodHttpDto],
  })
  async getAll(
    @Query('search') search?: string,
    @Query('active') active?: string,
  ): Promise<SuccessResponseDto<PaymentMethodHttpDto[]>> {
    const where: any = { deleted_at: null };

    if (active !== undefined && active !== '') {
      where.active = active === 'true';
    }

    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { code: { contains: s, mode: 'insensitive' } },
        { name: { contains: s, mode: 'insensitive' } },
        { description: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [records, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_payment_method.findMany({
        where,
        orderBy: [{ code: 'asc' }],
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    const items = records.map((r) => this.toHttpDto(r, catalogStatus));

    return new SuccessResponseDto<PaymentMethodHttpDto[]>(
      items,
      HttpStatus.OK,
      'Métodos de pago obtenidos exitosamente',
    );
  }

  @Permissions('ver-metodo-pago', 'listar-metodos-pago')
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un método de pago por ID o código' })
  @ApiParam({ name: 'id', description: 'UUID o código del método de pago' })
  @ApiResponse({
    status: 200,
    description: 'Método de pago obtenido exitosamente',
    type: PaymentMethodHttpDto,
  })
  async getById(@Param('id') id: string): Promise<SuccessResponseDto<PaymentMethodHttpDto>> {
    const [record, catalogStatus] = await Promise.all([
      this.findByIdOrCode(id),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);
    if (!record) {
      throw new NotFoundException('PaymentMethod', id);
    }

    return new SuccessResponseDto<PaymentMethodHttpDto>(
      this.toHttpDto(record, catalogStatus),
      HttpStatus.OK,
      'Método de pago obtenido exitosamente',
    );
  }

  @Permissions('crear-metodo-pago')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un nuevo método de pago' })
  @ApiResponse({
    status: 201,
    description: 'Método de pago creado exitosamente',
    type: PaymentMethodHttpDto,
  })
  async create(
    @Body() dto: CreatePaymentMethodDto,
  ): Promise<SuccessResponseDto<PaymentMethodHttpDto>> {
    const normalizedCode = dto.code.trim().toUpperCase();
    const normalizedName = dto.name.trim();

    const existingCode = await this.prisma.client.ctl_payment_method.findFirst({
      where: { code: normalizedCode, deleted_at: null },
    });
    if (existingCode) {
      throw new ConflictException(`Ya existe un método de pago con el código '${normalizedCode}'`);
    }

    const existingName = await this.prisma.client.ctl_payment_method.findFirst({
      where: { name: { equals: normalizedName, mode: 'insensitive' }, deleted_at: null },
    });
    if (existingName) {
      throw new ConflictException(`Ya existe un método de pago con el nombre '${normalizedName}'`);
    }

    const [created, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_payment_method.create({
        data: {
          code: normalizedCode,
          name: normalizedName,
          description: dto.description?.trim() || null,
          active: dto.active ?? true,
        },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    return new SuccessResponseDto<PaymentMethodHttpDto>(
      this.toHttpDto(created, catalogStatus),
      HttpStatus.CREATED,
      'Método de pago creado exitosamente',
    );
  }

  @Permissions('editar-metodo-pago')
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un método de pago existente' })
  @ApiParam({ name: 'id', description: 'UUID o código del método de pago' })
  @ApiResponse({
    status: 200,
    description: 'Método de pago actualizado exitosamente',
    type: PaymentMethodHttpDto,
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<SuccessResponseDto<PaymentMethodHttpDto>> {
    const existing = await this.findByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('PaymentMethod', id);
    }

    let normalizedCode = existing.code;
    if (dto.code) {
      normalizedCode = dto.code.trim().toUpperCase();
      const codeConflict = await this.prisma.client.ctl_payment_method.findFirst({
        where: {
          code: normalizedCode,
          id: { not: existing.id },
          deleted_at: null,
        },
      });
      if (codeConflict) {
        throw new ConflictException(`El código '${normalizedCode}' ya está en uso`);
      }
    }

    let normalizedName = existing.name;
    if (dto.name) {
      normalizedName = dto.name.trim();
      const nameConflict = await this.prisma.client.ctl_payment_method.findFirst({
        where: {
          name: { equals: normalizedName, mode: 'insensitive' },
          id: { not: existing.id },
          deleted_at: null,
        },
      });
      if (nameConflict) {
        throw new ConflictException(`El nombre '${normalizedName}' ya está en uso`);
      }
    }

    const [updated, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_payment_method.update({
        where: { id: existing.id },
        data: {
          code: normalizedCode,
          name: normalizedName,
          description: dto.description !== undefined ? dto.description?.trim() || null : existing.description,
          active: dto.active !== undefined ? dto.active : existing.active,
        },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    return new SuccessResponseDto<PaymentMethodHttpDto>(
      this.toHttpDto(updated, catalogStatus),
      HttpStatus.OK,
      'Método de pago actualizado exitosamente',
    );
  }

  @Permissions('cambiar-estado-metodo-pago', 'editar-metodo-pago')
  @Patch(':id/toggle-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar o desactivar un método de pago' })
  @ApiParam({ name: 'id', description: 'UUID o código del método de pago' })
  @ApiResponse({
    status: 200,
    description: 'Estado del método de pago actualizado exitosamente',
    type: PaymentMethodHttpDto,
  })
  async toggleStatus(@Param('id') id: string): Promise<SuccessResponseDto<PaymentMethodHttpDto>> {
    const existing = await this.findByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('PaymentMethod', id);
    }

    const [updated, catalogStatus] = await Promise.all([
      this.prisma.client.ctl_payment_method.update({
        where: { id: existing.id },
        data: { active: !existing.active },
      }),
      GetBooleanStatusCatalogService.getStatus(this.prisma),
    ]);

    return new SuccessResponseDto<PaymentMethodHttpDto>(
      this.toHttpDto(updated, catalogStatus),
      HttpStatus.OK,
      `Método de pago ${updated.active ? 'activado' : 'desactivado'} exitosamente`,
    );
  }

  @Permissions('eliminar-metodo-pago')
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar (lógicamente) un método de pago' })
  @ApiParam({ name: 'id', description: 'UUID o código del método de pago' })
  @ApiResponse({
    status: 200,
    description: 'Método de pago eliminado exitosamente',
  })
  async delete(@Param('id') id: string): Promise<SuccessResponseDto<{ id: string }>> {
    const existing = await this.findByIdOrCode(id);
    if (!existing) {
      throw new NotFoundException('PaymentMethod', id);
    }

    await this.prisma.client.ctl_payment_method.update({
      where: { id: existing.id },
      data: {
        deleted_at: new Date(),
        active: false,
      },
    });

    return new SuccessResponseDto<{ id: string }>(
      { id: existing.id },
      HttpStatus.OK,
      'Método de pago eliminado exitosamente',
    );
  }

  private async findByIdOrCode(identifier: string) {
    if (UUID_REGEX.test(identifier)) {
      return this.prisma.client.ctl_payment_method.findFirst({
        where: { id: identifier, deleted_at: null },
      });
    }
    return this.prisma.client.ctl_payment_method.findFirst({
      where: { code: identifier.trim().toUpperCase(), deleted_at: null },
    });
  }

  private toHttpDto(
    record: any,
    catalogStatus?: Map<string, BooleanStatusData>,
  ): PaymentMethodHttpDto {
    let status = undefined;
    if (catalogStatus) {
      try {
        status = StatusMapperUtil.getStatusFromBoolean(
          record.active,
          catalogStatus,
          'toHttpDto',
        );
      } catch {
        status = undefined;
      }
    }

    return {
      id: record.id,
      code: record.code,
      name: record.name,
      description: record.description,
      active: record.active,
      status,
      created_at: record.created_at,
      updated_at: record.updated_at,
    };
  }
}

