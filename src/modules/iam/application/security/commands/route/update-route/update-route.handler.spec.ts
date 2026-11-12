import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateRouteHandler } from './update-route.handler';
import { RouteRepository } from '@/modules/iam/domain/repositories/route-repository';
import { EventDispatcherPort } from '@/shared/domain/ports/event-dispatcher.port';
import { UpdateRouteCommand } from './update-route.command';
import { RouteDto } from '@/modules/iam/application/security/dtos/route.dto';
import { Route } from '@/modules/iam/domain/entities/route.entity';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { RouteUpdatedEvent } from '@/modules/iam/domain/events/route-updated.event';

describe('UpdateRouteHandler', () => {
  const ROUTE_ID = '11111111-1111-4111-8111-111111111111';
  const PARENT_ID = '22222222-2222-4222-8222-222222222222';

  let handler: UpdateRouteHandler;
  let findByIdMock: ReturnType<typeof vi.fn>;
  let updateMock: ReturnType<typeof vi.fn>;
  let dispatchMock: ReturnType<typeof vi.fn>;
  let mockRepo: RouteRepository;
  let mockDispatcher: EventDispatcherPort;

  beforeEach(() => {
    const createMock = vi.fn();
    updateMock = vi.fn().mockResolvedValue(undefined);
    findByIdMock = vi.fn();
    dispatchMock = vi.fn().mockResolvedValue(undefined);

    mockRepo = new (class extends RouteRepository {
      create = createMock;
      update = updateMock;
      findById = findByIdMock;
    })();

    mockDispatcher = new (class extends EventDispatcherPort {
      dispatch = dispatchMock;
    })();

    handler = new UpdateRouteHandler(mockRepo, mockDispatcher);
  });

  interface RouteTestOverrides {
    id: string;
    name?: string;
    description?: string;
    icon?: string;
    uri?: string;
    active?: boolean;
    show?: boolean;
    order?: number;
    required_auth?: boolean;
    title?: string;
    permissions_id?: string[];
    id_parent?: string | null;
  }

  const buildCommand = (overrides: RouteTestOverrides): UpdateRouteCommand => {
    const dto = new RouteDto(
      overrides.name ?? 'Roles',
      overrides.description ?? 'Gestión de roles',
      overrides.icon ?? 'pi pi-users',
      overrides.uri ?? '/admin/roles',
      overrides.active ?? true,
      overrides.show ?? true,
      overrides.order ?? 1,
      overrides.required_auth ?? true,
      overrides.id,
      overrides.title ?? 'Roles',
      undefined,
      undefined,
      undefined,
      overrides.permissions_id,
      overrides.id_parent,
    );
    return new UpdateRouteCommand(Object.assign(dto, { id: overrides.id }));
  };

  it('throws BadRequestException when route id is missing', async () => {
    const cmd = buildCommand({ id: '' });

    await expect(handler.execute(cmd)).rejects.toThrow(BadRequestException);
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('blocks self-parenting (id_parent === id) with BadRequestException', async () => {
    const cmd = buildCommand({ id: ROUTE_ID, id_parent: ROUTE_ID });

    await expect(handler.execute(cmd)).rejects.toThrow(
      'Una ruta no puede ser su propio padre',
    );
    expect(findByIdMock).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when route does not exist', async () => {
    findByIdMock.mockResolvedValue(null);
    const cmd = buildCommand({ id: ROUTE_ID });

    await expect(handler.execute(cmd)).rejects.toThrow(NotFoundException);
  });

  it('updates title, id_parent, omits undefined permissions_id, and dispatches RouteUpdatedEvent with id', async () => {
    const existing = Route.create({
      id: ROUTE_ID,
      name: 'Old Name',
      title: 'Old Title',
      description: 'Descripción previa',
      icon: 'pi pi-circle',
      uri: '/admin/old',
      order: 1,
      active: true,
      show: true,
      required_auth: true,
    });
    findByIdMock.mockResolvedValue(existing);

    const cmd = buildCommand({
      id: ROUTE_ID,
      name: 'New Name',
      title: 'New Title',
      description: 'Descripción actualizada',
      uri: '/admin/new',
      order: 3,
      id_parent: PARENT_ID,
      permissions_id: undefined,
    });

    await handler.execute(cmd);

    expect(updateMock).toHaveBeenCalledTimes(1);
    const updatedEntity = updateMock.mock.calls[0][0];
    expect(updatedEntity.getTitle()?.value()).toBe('New Title');
    expect(updatedEntity.getIdParent()?.value()).toBe(PARENT_ID);
    expect(updatedEntity.getPermissionsId()).toBeUndefined();

    expect(dispatchMock).toHaveBeenCalledTimes(1);
    const events = dispatchMock.mock.calls[0][0];
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(RouteUpdatedEvent);
    expect(events[0].id).toBe(ROUTE_ID);
  });
});
