import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { SecurityAuthorizationPort } from '@/modules/iam/domain/ports/security-authorization.port';
import { CachePort } from '@/modules/iam/domain/ports/cache.port';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import { Menu, MenuNode } from '@/modules/iam/domain/entities/menu.entity';
import { Menu as MenuInterface } from '@/modules/iam/infrastructure/interfaces/menu.interface';
import { MultipleStatusCode } from '@/shared/domain/enums/multiple-status';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { StorageFileReaderPort } from '@/modules/storage/domain/ports/storage-file-reader.port';

const ROLES_CACHE_TTL_MS = 1_800_000;
const MENU_CACHE_TTL_MS = 1_800_000;
const PERMISSIONS_CACHE_TTL_MS = 3_600_000;
const MAX_MENU_DEPTH = 10;

interface VersionedMenuCache {
  version: string;
  items: MenuInterface[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMenuInterface(value: unknown, depth = 0): value is MenuInterface {
  if (depth > MAX_MENU_DEPTH || !isRecord(value)) {
    return false;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    typeof value.icon !== 'string' ||
    typeof value.uri !== 'string' ||
    typeof value.order !== 'number' ||
    typeof value.active !== 'boolean' ||
    typeof value.show !== 'boolean' ||
    typeof value.required_auth !== 'boolean' ||
    !Array.isArray(value.children)
  ) {
    return false;
  }
  const validParent =
    value.parent === null || isMenuInterface(value.parent, depth + 1);
  if (!validParent) {
    return false;
  }
  return value.children.every((child) => isMenuInterface(child, depth + 1));
}

function isVersionedMenuCache(value: unknown): value is VersionedMenuCache {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.version === 'string' &&
    value.version.length > 0 &&
    Array.isArray(value.items) &&
    value.items.every((item) => isMenuInterface(item))
  );
}

@Injectable()
export class ImplSecurityAuthorizationPort implements SecurityAuthorizationPort {
  private readonly logger = new Logger(ImplSecurityAuthorizationPort.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionContext: TransactionContextService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly fileReader: StorageFileReaderPort,
    private readonly cachePort: CachePort,
  ) {}

  private getPrismaClient() {
    return this.prisma.client;
  }

  async hasRole(role: string[], id_user: string): Promise<boolean> {
    try {
      const cacheKey = `user:${id_user}:roles`;
      let cachedRoles: string[] | undefined;

      try {
        cachedRoles = await this.cacheManager.get<string[]>(cacheKey);
      } catch (error) {
        this.logger.warn(
          `Cache GET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (!Array.isArray(cachedRoles)) {
        const prisma = this.getPrismaClient();
        const user = await prisma.mnt_user.findFirst({
          where: { id: id_user, deleted_at: null },
          include: {
            mnt_user_rol: {
              where: {
                deleted_at: null,
                mnt_role: {
                  deleted_at: null,
                  ctl_status: { code: MultipleStatusCode.ACTIVE },
                },
              },
              include: {
                mnt_role: { select: { name: true } },
              },
            },
          },
        });
        if (!user) {
          return false;
        }
        cachedRoles = [
          ...new Set(user.mnt_user_rol.map((ur) => ur.mnt_role.name)),
        ];
        try {
          await this.cacheManager.set(
            cacheKey,
            cachedRoles,
            ROLES_CACHE_TTL_MS,
          );
        } catch (error) {
          this.logger.warn(
            `Cache SET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return cachedRoles.some((r) => role.includes(r));
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error(String(error));
    }
  }

  async checkPermission(permission: string, id_user: string): Promise<boolean> {
    try {
      const cacheKey = `user:${id_user}:permissions`;
      let cachedPermissions: string[] | undefined;

      try {
        cachedPermissions = await this.cacheManager.get<string[]>(cacheKey);
      } catch (error) {
        this.logger.warn(
          `Cache GET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (!Array.isArray(cachedPermissions)) {
        const prisma = this.getPrismaClient();
        const user = await prisma.mnt_user.findFirst({
          where: { id: id_user, deleted_at: null },
          include: {
            mnt_user_rol: {
              where: {
                deleted_at: null,
                mnt_role: {
                  deleted_at: null,
                  ctl_status: { code: MultipleStatusCode.ACTIVE },
                },
              },
              include: {
                mnt_role: {
                  include: {
                    rol_permissions: {
                      where: {
                        deleted_at: null,
                        ctl_permissions: {
                          active: true,
                          deleted_at: null,
                        },
                      },
                      include: {
                        ctl_permissions: {
                          select: { name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
        if (!user) {
          return false;
        }
        cachedPermissions = [
          ...new Set(
            user.mnt_user_rol
              .flatMap((userRol) => userRol.mnt_role.rol_permissions)
              .map((rolPermission) => rolPermission.ctl_permissions.name),
          ),
        ];
        try {
          await this.cacheManager.set(
            cacheKey,
            cachedPermissions,
            PERMISSIONS_CACHE_TTL_MS,
          );
        } catch (error) {
          this.logger.warn(
            `Cache SET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
      return cachedPermissions.includes(permission);
    } catch (error) {
      throw new Error(String(error));
    }
  }

  private toMenuEntity(item: MenuInterface): Menu<MenuNode> {
    return Menu.create<MenuNode>({
      id: item.id,
      name: item.name,
      title: item.title,
      description: item.description,
      icon: item.icon,
      uri: item.uri,
      order: item.order,
      active: item.active,
      show: item.show,
      required_auth: item.required_auth,
      parent: item.parent,
      children: item.children,
    });
  }

  async filterRoutesForUser(id_user: string): Promise<Menu<MenuNode>[]> {
    const cacheKey = `user:${id_user}:menu`;
    const currentVersion = await this.cachePort.getMenuCacheVersion();

    let cached: unknown;
    try {
      cached = await this.cacheManager.get<unknown>(cacheKey);
    } catch (error) {
      this.logger.warn(
        `Cache GET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    if (isVersionedMenuCache(cached) && cached.version === currentVersion) {
      try {
        return cached.items.map((item) => this.toMenuEntity(item));
      } catch (error) {
        this.logger.warn(
          `Cached menu payload invalid for "${cacheKey}", rebuilding from DB: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    try {
      const prisma = this.getPrismaClient();

      // 1. Obtener IDs de permisos activos del usuario (solo roles y permisos activos y no eliminados)
      const user = await prisma.mnt_user.findFirst({
        where: { id: id_user, deleted_at: null },
        include: {
          mnt_user_rol: {
            where: {
              deleted_at: null,
              mnt_role: {
                deleted_at: null,
                ctl_status: { code: MultipleStatusCode.ACTIVE },
              },
            },
            include: {
              mnt_role: {
                include: {
                  rol_permissions: {
                    where: {
                      deleted_at: null,
                      ctl_permissions: {
                        active: true,
                        deleted_at: null,
                      },
                    },
                    include: {
                      ctl_permissions: {
                        select: { id: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        return [];
      }

      const permissionIds = new Set<string>(
        user.mnt_user_rol
          .flatMap((userRol) => userRol.mnt_role.rol_permissions)
          .map((rolPermission) => rolPermission.ctl_permissions.id),
      );

      // 2. Obtener TODAS las rutas activas (no eliminadas) con sus permisos activos
      const routes = await prisma.mnt_route.findMany({
        where: { active: true, deleted_at: null },
        include: {
          mnt_route_permissions: {
            where: {
              deleted_at: null,
              ctl_permissions: {
                active: true,
                deleted_at: null,
              },
            },
            select: {
              id_permission: true,
            },
          },
        },
        orderBy: [{ order: 'asc' }, { title: 'asc' }],
      });

      // 3. Indexar rutas por id_parent para construir árbol recursivo N-niveles sin duplicar hijos en raíz
      type RouteRow = (typeof routes)[number];
      const childrenByParent = new Map<string | null, RouteRow[]>();
      for (const route of routes) {
        const parentKey = route.id_parent ?? null;
        const siblings = childrenByParent.get(parentKey) ?? [];
        siblings.push(route);
        childrenByParent.set(parentKey, siblings);
      }

      const buildNode = (
        route: RouteRow,
        ancestors: Set<string>,
      ): MenuInterface | null => {
        if (ancestors.has(route.id)) {
          return null;
        }

        const rawChildren = childrenByParent.get(route.id) ?? [];
        const isContainer = rawChildren.length > 0;

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(route.id);

        const builtChildren = rawChildren
          .map((child) => buildNode(child, nextAncestors))
          .filter((child): child is MenuInterface => child !== null);

        const routePermissionIds = route.mnt_route_permissions.map(
          (rp) => rp.id_permission,
        );

        let hasAccess = false;
        if (isContainer) {
          // Contenedores requieren al menos un hijo autorizado y, si tienen permisos explícitos, al menos uno (.some)
          if (builtChildren.length === 0) {
            hasAccess = false;
          } else if (!route.required_auth || routePermissionIds.length === 0) {
            hasAccess = true;
          } else {
            hasAccess = routePermissionIds.some((permId) =>
              permissionIds.has(permId),
            );
          }
        } else {
          // Rutas hoja: rutas públicas ocultas (/login, /forbidden, etc.) no entran al menú de sesión
          if (!route.required_auth) {
            hasAccess = route.show;
          } else if (routePermissionIds.length === 0) {
            hasAccess = false;
          } else {
            hasAccess = routePermissionIds.every((permId) =>
              permissionIds.has(permId),
            );
          }
        }

        if (!hasAccess) {
          return null;
        }

        const safeName =
          route.name.trim().length >= 2 ? route.name.trim() : 'menu-item';
        const safeTitle =
          route.title.trim().length >= 2 ? route.title.trim() : safeName;
        const safeDescription =
          route.description && route.description.trim().length >= 2
            ? route.description.trim()
            : safeTitle;
        const safeIcon =
          route.icon.trim().length >= 2 ? route.icon.trim() : 'pi pi-circle';

        return {
          id: route.id,
          name: safeName,
          title: safeTitle,
          description: safeDescription,
          icon: safeIcon,
          uri: route.uri,
          order: Number(route.order ?? 0),
          active: route.active,
          show: route.show,
          required_auth: route.required_auth,
          id_parent: route.id_parent ?? null,
          parent: null,
          children: builtChildren,
        };
      };

      const rootRoutes = childrenByParent.get(null) ?? [];
      const menuTree = rootRoutes
        .map((route) => buildNode(route, new Set<string>()))
        .filter((node): node is MenuInterface => node !== null);

      const cachePayload: VersionedMenuCache = {
        version: currentVersion,
        items: menuTree,
      };

      try {
        await this.cacheManager.set(cacheKey, cachePayload, MENU_CACHE_TTL_MS);
      } catch (error) {
        this.logger.warn(
          `Cache SET failed for "${cacheKey}": ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return menuTree.map((item) => this.toMenuEntity(item));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error en filterRoutesForUser para usuario ${id_user}: ${errorMessage}`,
      );
      throw new Error(errorMessage);
    }
  }

  async getUserProfileImg(id_user: string): Promise<string | null> {
    const prisma = this.getPrismaClient();
    const user = await prisma.mnt_user.findUnique({
      where: { id: id_user },
      select: {
        mnt_people: { select: { img_path: true } },
      },
    });
    const imgPath = user?.mnt_people?.img_path ?? null;
    if (!imgPath) return null;
    return this.fileReader.readFileAsBase64(imgPath);
  }
}
