import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

export type TrustProxySetting = boolean | number | string;

/**
 * Interpreta `TRUST_PROXY` (mismos valores que `trust proxy` de Express):
 * - vacío / `false` → no se confía en ningún proxy (por defecto, seguro).
 * - número `N` → se confía en los últimos N saltos (p. ej. `1` detrás de Nginx,
 *   `2` detrás de Cloudflare + Nginx).
 * - lista separada por comas de IPs/CIDRs o alias (`loopback`, `uniquelocal`).
 * - `true` confía en cualquier `X-Forwarded-For` (no recomendado: falsificable).
 */
export function parseTrustProxy(raw?: string | null): TrustProxySetting {
  const value = raw?.trim();
  if (!value) return false;

  const lower = value.toLowerCase();
  if (lower === 'false') return false;
  if (lower === 'true') return true;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

export function setupTrustProxy(
  app: NestExpressApplication,
  configService: ConfigService,
): void {
  const setting = parseTrustProxy(configService.get<string>('TRUST_PROXY'));
  app.set('trust proxy', setting);
}
