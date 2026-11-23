import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import {
  AuditLogEntry,
  AuditLogService,
} from '@/modules/audit/application/services/audit-log.service';
import {
  AUDITABLE_KEY,
  AuditableContext,
  AuditableOptions,
} from '@/shared/infrastructure/decorators/auditable.decorator';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import {
  extractClientIp,
  extractUserAgent,
} from '@/shared/infrastructure/http/utils/client-request-info';
import { sanitizePayload } from '@/shared/infrastructure/utils/sanitize-payload.util';

type AuthUserLike = { id?: string; user_name?: string } | undefined;

/**
 * Reads {@link Auditable} metadata and emits an entry on successful response.
 * Apply per-controller via `@UseInterceptors(AuditableInterceptor)` or
 * globally via APP_INTERCEPTOR in AppModule for blanket coverage.
 */
@Injectable()
export class AuditableInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLog: AuditLogService,
    @Optional()
    private readonly transactionContext?: TransactionContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const options = this.reflector.get<AuditableOptions | undefined>(
      AUDITABLE_KEY,
      context.getHandler(),
    );
    if (!options) return next.handle();
    if (context.getType() !== 'http') return next.handle();

    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthUserLike }>();
    const user = request.user;

    return next.handle().pipe(
      tap({
        next: (result: unknown) => {
          try {
            const entry: AuditLogEntry = {
              action: options.action,
              user_id: user?.id ?? null,
              user_name: user?.user_name ?? null,
              ip_address: this.extractIp(request),
              user_agent: this.resolveUserAgent(request),
              entity_type: options.entityType ?? null,
              entity_id: this.resolveEntityId(options, request, result) ?? null,
              request_id: this.extractRequestId(request),
              metadata: this.resolveMetadata(options, request, result),
            };

            if (this.transactionContext?.isInTransaction()) {
              this.transactionContext.addAfterCommitHook(() => {
                this.auditLog.log(entry);
              });
            } else {
              this.auditLog.log(entry);
            }
          } catch {
            // AuditLogService.log already swallows persistence failures; this
            // catch protects against synchronous extractor errors so they can't
            // turn a 200 response into a 500.
          }
        },
        error: () => {
          if (!options.failureAction) return;
          try {
            const bodyUserName =
              this.isRecord(request.body) &&
              typeof request.body.user_name === 'string'
                ? request.body.user_name
                : null;
            const meta: Record<string, unknown> = {};
            if (options.includePayload && this.isRecord(request.body)) {
              meta.payload = sanitizePayload(request.body);
            }

            this.auditLog.log({
              action: options.failureAction,
              user_id: user?.id ?? null,
              user_name: user?.user_name ?? bodyUserName,
              ip_address: this.extractIp(request),
              user_agent: this.resolveUserAgent(request),
              entity_type: options.entityType ?? null,
              entity_id:
                this.resolveEntityId(options, request, undefined) ?? null,
              request_id: this.extractRequestId(request),
              metadata: Object.keys(meta).length > 0 ? meta : null,
            });
          } catch {
            // Protect against extractor errors on failure path
          }
        },
      }),
    );
  }

  private isRecord(v: unknown): v is Record<string, unknown> {
    return typeof v === 'object' && v !== null;
  }

  private extractRequestId(req: Request): string | null {
    const reqWithId = req as Request & { id?: string };
    if (typeof reqWithId.id === 'string' && reqWithId.id.length > 0) {
      return reqWithId.id;
    }
    const headerId = req.headers?.['x-request-id'];
    if (typeof headerId === 'string' && headerId.length > 0) {
      return headerId;
    }
    return null;
  }

  private resolveMetadata(
    options: AuditableOptions,
    request: Request,
    result: unknown,
  ): Record<string, unknown> | null {
    const params = (request.params ?? {}) as Record<string, unknown>;
    const body = (this.isRecord(request.body) ? request.body : {}) as Record<
      string,
      unknown
    >;
    const ctx: AuditableContext = { params, body, result };

    const meta: Record<string, unknown> = {};

    if (typeof options.metadataFrom === 'function') {
      const custom = options.metadataFrom(ctx);
      if (this.isRecord(custom)) {
        Object.assign(meta, sanitizePayload(custom));
      }
    }

    if (typeof options.diffFrom === 'function') {
      const diff = options.diffFrom(ctx);
      if (diff !== undefined) {
        meta.diff = sanitizePayload(diff);
      }
    }

    if (options.includePayload && this.isRecord(request.body)) {
      meta.payload = sanitizePayload(request.body);
    }

    if (options.includeResult && result !== undefined) {
      meta.result = sanitizePayload(result);
    }

    return Object.keys(meta).length > 0 ? meta : null;
  }

  private resolveEntityId(
    options: AuditableOptions,
    request: Request,
    result: unknown,
  ): string | undefined {
    if (typeof options.entityIdFrom === 'function') {
      return options.entityIdFrom({
        params: request.params ?? {},
        body: this.isRecord(request.body) ? request.body : {},
        result,
      });
    }
    const path = options.entityIdFrom ?? 'params.id';
    const [source, ...rest] = path.split('.');
    let root: unknown;
    if (source === 'params') root = request.params;
    else if (source === 'query') root = request.query;
    else if (source === 'body') root = request.body;
    else if (source === 'result') root = result;
    else return undefined;
    const value = rest.reduce<unknown>((acc, key) => {
      if (this.isRecord(acc)) {
        return acc[key];
      }
      return undefined;
    }, root);
    return typeof value === 'string' ? value : undefined;
  }

  private extractIp(req: Request): string | null {
    return extractClientIp(req);
  }

  private resolveUserAgent(req: Request): string | null {
    return extractUserAgent(req);
  }
}
