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
import { AuditLogService } from '@/modules/audit/application/services/audit-log.service';
import {
  AUDITABLE_KEY,
  AuditableOptions,
} from '@/shared/infrastructure/decorators/auditable.decorator';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

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
            const entry = {
              action: options.action,
              user_id: user?.id ?? null,
              user_name: user?.user_name ?? null,
              ip_address: this.extractIp(request),
              user_agent: this.extractUserAgent(request),
              entity_type: options.entityType ?? null,
              entity_id: this.resolveEntityId(options, request, result) ?? null,
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
            this.auditLog.log({
              action: options.failureAction,
              user_id: user?.id ?? null,
              user_name: user?.user_name ?? bodyUserName,
              ip_address: this.extractIp(request),
              user_agent: this.extractUserAgent(request),
              entity_type: options.entityType ?? null,
              entity_id:
                this.resolveEntityId(options, request, undefined) ?? null,
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
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return first.split(',')[0].trim();
    }
    return req.socket?.remoteAddress ?? null;
  }

  private extractUserAgent(req: Request): string | null {
    const ua = req.headers['user-agent'];
    if (!ua) return null;
    return Array.isArray(ua) ? String(ua[0]) : String(ua);
  }
}
