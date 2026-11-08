import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SuccessResponseDto } from '@/shared/infrastructure/http/dtos/http-success-response.dto';
import { HttpPaginatedResponseDto } from '@/shared/infrastructure/http/dtos/http-paginated-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '@/shared/infrastructure/decorators/permissions.decorator';
import { ConfigService } from '@nestjs/config';
import { Express } from 'express';
import {
  multerImageOptions,
  validateFileMagicBytes,
} from '@/modules/storage/infrastructure/config/multer-file-filter.config';
import { StorageFilesUploadFlowCommand } from '@/modules/storage/application/storage-files/commands/storage-files-upload-flow/storage-files-upload-flow.command';
import { GetStorageFilesQueryDto } from '@/modules/storage/infrastructure/dtos/query/get-storage-files-query.dto';
import { GetStorageFilesQuery } from '@/modules/storage/application/storage-files/queries/get-storage-files/get-storage-files.query';
import { StorageFilesHttpDto } from '@/modules/storage/infrastructure/dtos/http/storage-files-http-dto/storage-files-http.dto';
import { Pagination } from '@/shared/domain/value-object/pagination';
import { StorageFileListDto } from '@/modules/storage/application/dtos/storage-file-list.dto';
import { StorageFiles } from '@/modules/storage/domain/entities/storage-files';

type FileType = Express.Multer.File;

@ApiTags('Almacenamiento - Archivos')
@ApiBearerAuth('JWT-auth')
@Controller('storage-files')
export class StorageFilesController {
  constructor(
    private readonly command: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly configService: ConfigService,
  ) {}

  @Permissions('listar-archivos-almacenamiento')
  @Get()
  @HttpCode(200)
  @ApiOperation({
    summary: 'Listar archivos almacenados con paginación y filtro opcional por proveedor',
  })
  async getAll(
    @Query() query: GetStorageFilesQueryDto,
  ): Promise<
    SuccessResponseDto<HttpPaginatedResponseDto<StorageFilesHttpDto>>
  > {
    const appQuery = new GetStorageFilesQuery(query, query.id_provider);
    const result: Pagination<StorageFileListDto> | StorageFileListDto[] =
      await this.queryBus.execute(appQuery);

    const items =
      result instanceof Pagination ? result.getEntityList() : result;
    const totalItems =
      result instanceof Pagination ? result.getTotalItems() : items.length;
    const totalPages =
      result instanceof Pagination ? result.getTotalPages() : 1;

    const itemsHttp = items.map((f: StorageFileListDto) =>
      StorageFilesHttpDto.fromDto(f),
    );

    const response = new HttpPaginatedResponseDto<StorageFilesHttpDto>(
      itemsHttp,
      totalItems,
      totalPages,
      query.page,
      query.per_page,
    );
    return new SuccessResponseDto<
      HttpPaginatedResponseDto<StorageFilesHttpDto>
    >(response, HttpStatus.OK, 'Storage files retrieved successfully');
  }

  @Permissions('subir-multimedia-almacenamiento')
  @Post()
  @HttpCode(201)
  @ApiOperation({
    summary:
      'Subir archivo multimedia al almacenamiento configurado (S3 / Local)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({
    name: 'provider_code',
    required: false,
    description:
      'Código del proveedor de almacenamiento (LOCAL, S3). Si se omite, usa PROVIDER_STORAGE_CODE del entorno.',
    example: 'S3',
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description:
      'Directorio destino dentro del almacenamiento (ej. inventory_img, profile_img)',
    example: 'inventory_img',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        content_file: { type: 'string', format: 'binary' },
      },
      required: ['content_file'],
    },
  })
  @UseInterceptors(FileInterceptor('content_file', multerImageOptions))
  async upload(
    @UploadedFile() content_file: FileType,
    @Query('provider_code') providerCode?: string,
    @Query('folder') folder?: string,
  ): Promise<SuccessResponseDto<StorageFilesHttpDto>> {
    const file: FileType = content_file;
    if (file?.buffer && !validateFileMagicBytes(file.buffer, file.mimetype)) {
      throw new BadRequestException(
        `File content does not match its declared MIME type '${file.mimetype}'`,
      );
    }

    const resolvedProvider =
      providerCode ??
      this.configService.get<string>('PROVIDER_STORAGE_CODE') ??
      'LOCAL';

    const storageFileUploadFlowCommand =
      new StorageFilesUploadFlowCommand<FileType>(
        file,
        resolvedProvider,
        folder,
      );

    const result = await this.command.execute<
      StorageFilesUploadFlowCommand<FileType>,
      StorageFiles<FileType>
    >(storageFileUploadFlowCommand);

    return new SuccessResponseDto<StorageFilesHttpDto>(
      StorageFilesHttpDto.fromEntity(result),
      HttpStatus.CREATED,
      'Archivo subido exitosamente al almacenamiento',
    );
  }
}
