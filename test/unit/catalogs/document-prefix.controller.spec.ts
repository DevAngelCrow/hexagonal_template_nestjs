import { describe, it, expect, vi } from 'vitest';
import { HttpStatus } from '@nestjs/common';
import type { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DocumentPrefixController } from '@/modules/catalogs/infrastructure/controllers/document-prefix.controller';
import { DocumentPrefixDto } from '@/modules/catalogs/application/dtos/document-prefix.dto';
import { GetDocumentPrefixesQuery } from '@/modules/catalogs/application/document-prefix/queries/get-document-prefixes/get-document-prefixes.query';
import { GetDocumentPrefixQuery } from '@/modules/catalogs/application/document-prefix/queries/get-document-prefix/get-document-prefix.query';
import { CreateDocumentPrefixCommand } from '@/modules/catalogs/application/document-prefix/commands/create-document-prefix/create-document-prefix.command';
import { UpdateDocumentPrefixCommand } from '@/modules/catalogs/application/document-prefix/commands/update-document-prefix/update-document-prefix.command';
import { ToggleStatusDocumentPrefixCommand } from '@/modules/catalogs/application/document-prefix/commands/toggle-status-document-prefix/toggle-status-document-prefix.command';
import { CreateDocumentPrefixHandler } from '@/modules/catalogs/application/document-prefix/commands/create-document-prefix/create-document-prefix.handler';
import type { DocumentPrefixRepository } from '@/modules/catalogs/domain/repositories/document-prefix-repository';
import type { DocumentPrefixQueriesRepository } from '@/modules/catalogs/application/repositories/document-prefix-read.repository';
import { DocumentPrefix } from '@/modules/catalogs/domain/entities/document-prefix';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';

const sampleDto = new DocumentPrefixDto({
  id: '00000000-0000-4000-8000-000000000701',
  code: 'DOCUMENT',
  prefix: 'DOC',
  name: 'Serie General de Documentos',
  description: 'Prefijo genérico',
  entity_target: 'ctl_document_prefix',
  current_year: 2026,
  current_value: 0,
  padding: 4,
  reset_yearly: true,
  separator: '-',
  next_preview: 'DOC-2026-0001',
  active: true,
});

describe('DocumentPrefixController & CreateDocumentPrefixHandler', () => {
  it('lists, creates, updates, toggles status, and fetches by code via CQRS buses', async () => {
    const commandBus = {
      execute: vi
        .fn()
        .mockResolvedValueOnce(sampleDto)
        .mockResolvedValueOnce(sampleDto)
        .mockResolvedValueOnce({ ...sampleDto, active: false }),
    } as unknown as CommandBus;
    const queryBus = {
      execute: vi
        .fn()
        .mockResolvedValueOnce([sampleDto])
        .mockResolvedValueOnce(sampleDto),
    } as unknown as QueryBus;

    const controller = new DocumentPrefixController(commandBus, queryBus);

    const listRes = await controller.getAll();
    expect(queryBus.execute).toHaveBeenCalledWith(new GetDocumentPrefixesQuery());
    expect(listRes.statusCode).toBe(HttpStatus.OK);
    expect(listRes.data).toHaveLength(1);
    expect(listRes.data[0].next_preview).toBe('DOC-2026-0001');

    const createPayload = {
      code: 'DOCUMENT',
      prefix: 'DOC',
      name: 'Serie General de Documentos',
      entity_target: 'ctl_document_prefix',
    };
    const createRes = await controller.create(createPayload);
    expect(commandBus.execute).toHaveBeenCalledWith(
      new CreateDocumentPrefixCommand(createPayload),
    );
    expect(createRes.statusCode).toBe(HttpStatus.CREATED);

    const updateRes = await controller.update(sampleDto.id, { padding: 5 });
    expect(commandBus.execute).toHaveBeenCalledWith(
      new UpdateDocumentPrefixCommand(sampleDto.id, { padding: 5 }),
    );
    expect(updateRes.statusCode).toBe(HttpStatus.OK);

    const toggleRes = await controller.toggleStatus(sampleDto.id);
    expect(commandBus.execute).toHaveBeenCalledWith(
      new ToggleStatusDocumentPrefixCommand(sampleDto.id),
    );
    expect(toggleRes.data.active).toBe(false);

    const byCodeRes = await controller.getByCode('DOCUMENT');
    expect(queryBus.execute).toHaveBeenCalledWith(
      new GetDocumentPrefixQuery('DOCUMENT'),
    );
    expect(byCodeRes.data.code).toBe('DOCUMENT');
  });

  it('CreateDocumentPrefixHandler rejects duplicate code or prefix and persists normalized entity', async () => {
    const repository = {
      create: vi.fn().mockResolvedValue(
        DocumentPrefix.create({
          id: sampleDto.id,
          code: 'DOCUMENT',
          prefix: 'DOC',
          name: 'Serie General de Documentos',
          entity_target: 'ctl_document_prefix',
          active: true,
        }),
      ),
    } as unknown as DocumentPrefixRepository;

    const queriesRepository = {
      findByCode: vi.fn().mockResolvedValueOnce(sampleDto),
      findByPrefix: vi.fn().mockResolvedValue(null),
      getOneById: vi.fn().mockResolvedValue(sampleDto),
    } as unknown as DocumentPrefixQueriesRepository;

    const handler = new CreateDocumentPrefixHandler(
      repository,
      queriesRepository,
    );

    await expect(
      handler.execute(
        new CreateDocumentPrefixCommand({
          code: 'document',
          prefix: 'doc',
          name: 'Serie General de Documentos',
          entity_target: 'ctl_document_prefix',
        }),
      ),
    ).rejects.toThrow(ConflictException);

    vi.mocked(queriesRepository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(queriesRepository.findByPrefix).mockResolvedValueOnce(sampleDto);

    await expect(
      handler.execute(
        new CreateDocumentPrefixCommand({
          code: 'OTHER',
          prefix: 'doc',
          name: 'Otra Serie',
          entity_target: 'ctl_document_prefix',
        }),
      ),
    ).rejects.toThrow(ConflictException);

    vi.mocked(queriesRepository.findByCode).mockResolvedValueOnce(null);
    vi.mocked(queriesRepository.findByPrefix).mockResolvedValueOnce(null);

    const created = await handler.execute(
      new CreateDocumentPrefixCommand({
        code: ' document ',
        prefix: ' doc ',
        name: ' Serie General de Documentos ',
        entity_target: ' ctl_document_prefix ',
      }),
    );
    expect(created.code).toBe('DOCUMENT');
    expect(repository.create).toHaveBeenCalledTimes(1);
  });
});
