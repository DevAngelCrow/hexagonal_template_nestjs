import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Cache } from 'cache-manager';
import { ImplSecurityAuthorizationPort } from '@/modules/iam/infrastructure/persistence/security/impl-authorization.port';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import { StorageFileReaderPort } from '@/modules/storage/domain/ports/storage-file-reader.port';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { MultipleStatusCode } from '@/shared/domain/enums/multiple-status';

interface MockRouteRow {
  id: string;
  name: string;
  title: string;
  description: string | null;
  icon: string;
  uri: string;
  order: number | null;
  active: boolean;
  show: boolean;
  required_auth: boolean;
  id_parent: string | null;
  mnt_route_permissions: Array<{ id_permission: string }>;
}

describe('ImplSecurityAuthorizationPort', () => {
  let port: ImplSecurityAuthorizationPort;
  let mockPrismaClient: {
    mnt_user: { findFirst: ReturnType<typeof vi.fn> };
    mnt_route: { findMany: ReturnType<typeof vi.fn> };
  };
  let mockCacheManager: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
  };
  let mockCachePort: CachePort;

  const userId = '00000000-0000-4000-8000-000000000099';

  beforeEach(() => {
    mockPrismaClient = {
      mnt_user: { findFirst: vi.fn() },
      mnt_route: { findMany: vi.fn() },
    };

    const mockPrismaService = {
      client: mockPrismaClient,
    } as unknown as PrismaService;

    const mockTransactionContext = {} as TransactionContextService;
    const mockFileReader = {
      readFileAsBase64: vi.fn(),
    } as unknown as StorageFileReaderPort;

    mockCacheManager = {
      get: vi.fn().mockResolvedValue(undefined),
      set: vi.fn().mockResolvedValue(undefined),
    };

    mockCachePort = {
      invalidateUserPermissions: vi.fn(),
      invalidateUsersPermissions: vi.fn(),
      getMenuCacheVersion: vi.fn().mockResolvedValue('v-1'),
      invalidateAllMenus: vi.fn(),
    };

    port = new ImplSecurityAuthorizationPort(
      mockPrismaService,
      mockTransactionContext,
      mockCacheManager as unknown as Cache,
      mockFileReader,
      mockCachePort,
    );
  });

  const mockUserWithPermissions = (permissionIds: string[]) => {
    mockPrismaClient.mnt_user.findFirst.mockResolvedValue({
      id: userId,
      mnt_user_rol: [
        {
          mnt_role: {
            rol_permissions: permissionIds.map((id) => ({
              ctl_permissions: { id },
            })),
          },
        },
      ],
    });
  };

  const ROUTE_IDS = {
    dashboard: '00000000-0000-4000-8000-000000000001',
    login: '00000000-0000-4000-8000-000000000002',
    layout: '00000000-0000-4000-8000-000000000003',
    testView: '00000000-0000-4000-8000-000000000004',
    inventory: '00000000-0000-4000-8000-000000000005',
    productsGroup: '00000000-0000-4000-8000-000000000006',
    productsLeaf: '00000000-0000-4000-8000-000000000007',
    categoriesLeaf: '00000000-0000-4000-8000-000000000008',
    admin: '00000000-0000-4000-8000-000000000009',
    correo: '00000000-0000-4000-8000-000000000010',
    cached: '00000000-0000-4000-8000-000000000011',
    fresh: '00000000-0000-4000-8000-000000000012',
  };

  it('builds a recursive N-level tree without duplicating child routes at root and enforces container/leaf rules', async () => {
    mockUserWithPermissions(['perm-dashboard', 'perm-products', 'perm-test']);

    const routes: MockRouteRow[] = [
      {
        id: ROUTE_IDS.dashboard,
        name: 'dashboard',
        title: 'Tablero',
        description: null,
        icon: 'pi pi-objects-column',
        uri: '/dashboard',
        order: 1,
        active: true,
        show: true,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [{ id_permission: 'perm-dashboard' }],
      },
      {
        id: ROUTE_IDS.login,
        name: 'login',
        title: 'Inicio de sesión',
        description: 'Login',
        icon: 'pi pi-sign-in',
        uri: '/login',
        order: 1,
        active: true,
        show: false,
        required_auth: false,
        id_parent: null,
        mnt_route_permissions: [{ id_permission: 'perm-login' }],
      },
      {
        id: ROUTE_IDS.layout,
        name: 'layout',
        title: 'Layout',
        description: 'Layout',
        icon: 'pi pi-home',
        uri: '/',
        order: 2,
        active: true,
        show: false,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [],
      },
      {
        id: ROUTE_IDS.testView,
        name: 'test-view',
        title: 'Vista Test',
        description: 'Vista de componentes',
        icon: 'pi pi-sliders-v',
        uri: '/test-view',
        order: 1,
        active: true,
        show: false,
        required_auth: true,
        id_parent: ROUTE_IDS.layout,
        mnt_route_permissions: [{ id_permission: 'perm-test' }],
      },
      {
        id: ROUTE_IDS.inventory,
        name: 'inventory-parent',
        title: 'Inventario',
        description: 'Menú de inventario',
        icon: 'pi pi-box',
        uri: '/inventory',
        order: 3,
        active: true,
        show: true,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [
          { id_permission: 'perm-products' },
          { id_permission: 'perm-categories' },
        ],
      },
      {
        id: ROUTE_IDS.productsGroup,
        name: 'products-submenu',
        title: 'Catálogo',
        description: 'Subgrupo nivel 2',
        icon: 'pi pi-list',
        uri: '/inventory/catalog',
        order: 1,
        active: true,
        show: true,
        required_auth: true,
        id_parent: ROUTE_IDS.inventory,
        mnt_route_permissions: [],
      },
      {
        id: ROUTE_IDS.productsLeaf,
        name: 'products',
        title: 'Productos',
        description: 'Lista de productos',
        icon: 'pi pi-box',
        uri: '/inventory/products',
        order: 1,
        active: true,
        show: true,
        required_auth: true,
        id_parent: ROUTE_IDS.productsGroup,
        mnt_route_permissions: [{ id_permission: 'perm-products' }],
      },
      {
        id: ROUTE_IDS.categoriesLeaf,
        name: 'categories',
        title: 'Categorías',
        description: 'Categorías de productos',
        icon: 'pi pi-tags',
        uri: '/inventory/categories',
        order: 2,
        active: true,
        show: true,
        required_auth: true,
        id_parent: ROUTE_IDS.inventory,
        mnt_route_permissions: [
          { id_permission: 'perm-products' },
          { id_permission: 'perm-categories' },
        ],
      },
      {
        id: ROUTE_IDS.admin,
        name: 'admin',
        title: 'Administración',
        description: 'Administración',
        icon: 'pi pi-cog',
        uri: '/admin',
        order: 4,
        active: true,
        show: true,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [],
      },
      {
        id: ROUTE_IDS.correo,
        name: 'Correo',
        title: 'Correo sin permisos',
        description: 'Correo',
        icon: 'pi pi-envelope',
        uri: '/usuario-prueba',
        order: 1,
        active: true,
        show: false,
        required_auth: true,
        id_parent: ROUTE_IDS.admin,
        mnt_route_permissions: [],
      },
    ];

    mockPrismaClient.mnt_route.findMany.mockResolvedValue(routes);

    const result = await port.filterRoutesForUser(userId);
    const rootUris = result.map((m) => m.getUri().value());

    expect(rootUris).toEqual(['/dashboard', '/', '/inventory']);

    expect(result[0]?.getDescription().value()).toBe('Tablero');

    const inventoryNode = result[2]!;
    const inventoryChildren = inventoryNode.getChildren().map((c) => c.value());
    expect(inventoryChildren.map((c) => c.uri)).toEqual(['/inventory/catalog']);
    expect(inventoryChildren[0]?.children.map((c) => c.uri)).toEqual([
      '/inventory/products',
    ]);

    expect(mockPrismaClient.mnt_user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: userId, deleted_at: null },
        include: expect.objectContaining({
          mnt_user_rol: expect.objectContaining({
            where: expect.objectContaining({
              deleted_at: null,
              mnt_role: {
                deleted_at: null,
                ctl_status: { code: MultipleStatusCode.ACTIVE },
              },
            }),
          }),
        }),
      }),
    );

    expect(mockPrismaClient.mnt_route.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { active: true, deleted_at: null },
      }),
    );

    expect(mockCacheManager.set).toHaveBeenCalledWith(
      `user:${userId}:menu`,
      expect.objectContaining({
        version: 'v-1',
        items: expect.any(Array),
      }),
      expect.any(Number),
    );
  });

  it('hides layout container when user lacks permission for its only child (/test-view)', async () => {
    mockUserWithPermissions(['perm-layout']);

    mockPrismaClient.mnt_route.findMany.mockResolvedValue([
      {
        id: ROUTE_IDS.layout,
        name: 'layout',
        title: 'Layout',
        description: 'Layout',
        icon: 'pi pi-home',
        uri: '/',
        order: 1,
        active: true,
        show: false,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [{ id_permission: 'perm-layout' }],
      },
      {
        id: ROUTE_IDS.testView,
        name: 'test-view',
        title: 'Test View',
        description: 'Test View',
        icon: 'pi pi-sliders-v',
        uri: '/test-view',
        order: 1,
        active: true,
        show: false,
        required_auth: true,
        id_parent: ROUTE_IDS.layout,
        mnt_route_permissions: [{ id_permission: 'perm-test' }],
      },
    ]);

    const result = await port.filterRoutesForUser(userId);
    expect(result).toEqual([]);
  });

  it('uses versioned Redis cache on version match and rebuilds on version mismatch', async () => {
    const cachedNode = {
      id: ROUTE_IDS.cached,
      name: 'dashboard',
      title: 'Tablero',
      description: 'Tablero principal',
      icon: 'pi pi-home',
      uri: '/dashboard',
      order: 1,
      active: true,
      show: true,
      required_auth: true,
      id_parent: null,
      parent: null,
      children: [],
    };

    vi.mocked(mockCachePort.getMenuCacheVersion).mockResolvedValue('v-2');
    mockCacheManager.get.mockResolvedValueOnce({
      version: 'v-2',
      items: [cachedNode],
    });

    const hitResult = await port.filterRoutesForUser(userId);
    expect(hitResult).toHaveLength(1);
    expect(hitResult[0]?.getUri().value()).toBe('/dashboard');
    expect(mockPrismaClient.mnt_user.findFirst).not.toHaveBeenCalled();

    mockCacheManager.get.mockResolvedValueOnce({
      version: 'v-1',
      items: [cachedNode],
    });
    mockUserWithPermissions(['perm-dashboard']);
    mockPrismaClient.mnt_route.findMany.mockResolvedValue([
      {
        id: ROUTE_IDS.fresh,
        name: 'dashboard',
        title: 'Tablero Fresh',
        description: 'Tablero Fresh',
        icon: 'pi pi-home',
        uri: '/dashboard',
        order: 1,
        active: true,
        show: true,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [{ id_permission: 'perm-dashboard' }],
      },
    ]);

    const missResult = await port.filterRoutesForUser(userId);
    expect(missResult[0]?.getTitle().value()).toBe('Tablero Fresh');
    expect(mockCacheManager.set).toHaveBeenCalledWith(
      `user:${userId}:menu`,
      expect.objectContaining({ version: 'v-2' }),
      expect.any(Number),
    );
  });

  it('degrades gracefully to Postgres when Redis throws on get and set', async () => {
    mockCacheManager.get.mockRejectedValueOnce(new Error('Redis ECONNREFUSED'));
    mockCacheManager.set.mockRejectedValueOnce(new Error('Redis ECONNREFUSED'));

    mockUserWithPermissions(['perm-dashboard']);
    mockPrismaClient.mnt_route.findMany.mockResolvedValue([
      {
        id: ROUTE_IDS.dashboard,
        name: 'dashboard',
        title: 'Tablero',
        description: 'Tablero',
        icon: 'pi pi-objects-column',
        uri: '/dashboard',
        order: 1,
        active: true,
        show: true,
        required_auth: true,
        id_parent: null,
        mnt_route_permissions: [{ id_permission: 'perm-dashboard' }],
      },
    ]);

    const result = await port.filterRoutesForUser(userId);
    expect(result).toHaveLength(1);
    expect(result[0]?.getUri().value()).toBe('/dashboard');
  });
});
