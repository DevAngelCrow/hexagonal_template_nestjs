import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  CHECK_AUTHENTICATED_USER,
  CheckAuthenticatedUserMetadata,
} from '@/modules/iam/infrastructure/decorators/check-authenticated-user.decorator';
import { ForbiddenException } from '@/shared/application/exceptions/forbidden.exception';
import { extractRequestAuthUser } from '@/shared/infrastructure/http/utils/request-user.util';

function parseMetadata(
  raw: unknown,
): CheckAuthenticatedUserMetadata | undefined {
  if (typeof raw === 'string' && raw.length > 0) {
    return { paramName: raw, bypassWithPermissions: [] };
  }
  if (typeof raw === 'object' && raw !== null) {
    const paramName: unknown = Reflect.get(raw, 'paramName');
    const bypassRaw: unknown = Reflect.get(raw, 'bypassWithPermissions');
    if (typeof paramName === 'string' && paramName.length > 0) {
      const bypassWithPermissions = Array.isArray(bypassRaw)
        ? bypassRaw.filter((p): p is string => typeof p === 'string')
        : [];
      return { paramName, bypassWithPermissions };
    }
  }
  return undefined;
}

@Injectable()
export class CheckAuthenticatedUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const metadata = parseMetadata(
      this.reflector.get<unknown>(
        CHECK_AUTHENTICATED_USER,
        context.getHandler(),
      ),
    );
    if (!metadata) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = extractRequestAuthUser(request);
    const paramValue = request.params?.[metadata.paramName];

    if (
      user &&
      typeof paramValue === 'string' &&
      (user.id === paramValue || user.user_name === paramValue)
    ) {
      return true;
    }

    if (
      user &&
      metadata.bypassWithPermissions.some((perm) =>
        user.permissions.includes(perm),
      )
    ) {
      return true;
    }

    throw new ForbiddenException(
      'No tienes permiso para acceder a un recurso ajeno',
    );
  }
}
