const MAX_IP_LENGTH = 45; // Estándar IPv6 máximo (VARCHAR(45))
const MAX_USER_AGENT_LENGTH = 512; // Límite acotado para cabecera User-Agent

/** Subconjunto de `express.Request` necesario para extraer datos del cliente. */
export interface ClientRequestLike {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: { 'user-agent'?: string | string[] };
}

function normalizeIp(rawIp: string | undefined): string | null {
  const trimmed = rawIp?.trim();
  if (!trimmed) return null;
  const withoutMappedPrefix = trimmed.toLowerCase().startsWith('::ffff:')
    ? trimmed.slice('::ffff:'.length)
    : trimmed;
  return withoutMappedPrefix.slice(0, MAX_IP_LENGTH);
}

/**
 * Devuelve la IP del cliente usando únicamente `req.ip`.
 *
 * Express resuelve `req.ip` respetando el ajuste `trust proxy` (ver
 * `setupTrustProxy`): solo se confía en `X-Forwarded-For` de los proxies
 * declarados. Leer `X-Forwarded-For` / `CF-Connecting-IP` directamente permitiría
 * falsificar la IP registrada en bitácoras o controles de seguridad.
 */
export function extractClientIp(req: ClientRequestLike): string | null {
  return normalizeIp(req.ip ?? req.socket?.remoteAddress);
}

export function extractUserAgent(req: ClientRequestLike): string | null {
  const rawUserAgent = req.headers['user-agent'];
  const userAgent = Array.isArray(rawUserAgent)
    ? rawUserAgent[0]
    : rawUserAgent;
  const trimmed = userAgent?.trim();
  return trimmed ? trimmed.slice(0, MAX_USER_AGENT_LENGTH) : null;
}
