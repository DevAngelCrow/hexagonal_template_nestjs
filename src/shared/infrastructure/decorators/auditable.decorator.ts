import { SetMetadata } from '@nestjs/common';
import { AuditAction } from '@/shared/domain/enums/audit-action.enum';

export const AUDITABLE_KEY = 'audit:auditable';

export type AuditableContext = {
  params: Record<string, unknown>;
  body: Record<string, unknown>;
  result: unknown;
};

export type AuditableOptions = {
  action: AuditAction;
  /** Action to emit if the request fails with an exception (optional). */
  failureAction?: AuditAction;
  /** Business entity affected ('User', 'Document', etc). Optional. */
  entityType?: string;
  /**
   * Where to read the entity_id from. Defaults to `params.id`. Use 'body.foo'
   * to read from request body, or pass a function for custom resolution.
   */
  entityIdFrom?:
    | string
    | ((ctx: AuditableContext) => string | undefined);
  /** Whether to capture the sanitized request body in metadata.payload */
  includePayload?: boolean;
  /** Whether to capture the sanitized handler result in metadata.result */
  includeResult?: boolean;
  /** Function to compute state differences (before/after) */
  diffFrom?: (ctx: AuditableContext) => { before?: unknown; after?: unknown } | undefined;
  /** Function to extract custom metadata */
  metadataFrom?: (ctx: AuditableContext) => Record<string, unknown> | undefined;
};

/**
 * Marks an endpoint for automatic audit logging by {@link AuditableInterceptor}.
 *
 * Logs are emitted only on success (the interceptor wraps the handler with
 * tap). Failed requests don't generate audit entries here — failures are
 * surfaced via the global exception filter / structured logs instead.
 *
 * Example:
 *   @Auditable({ action: AuditAction.LOGIN_SUCCESS })
 *   @Post('login')
 *   async login() {}
 */
export const Auditable = (options: AuditableOptions) =>
  SetMetadata(AUDITABLE_KEY, options);
