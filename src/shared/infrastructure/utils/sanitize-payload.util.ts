const SENSITIVE_KEYS = new Set([
  'password',
  'current_password',
  'new_password',
  'old_password',
  'confirm_password',
  'password_confirmation',
  'token',
  'access_token',
  'refresh_token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'secret_key',
  'authorization',
  'cookie',
  'cvv',
  'cvc',
  'card_number',
  'credit_card',
]);

const REDACTED = '[REDACTED]';

export function sanitizePayload<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizePayload(item)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.has(lowerKey)) {
        result[key] = REDACTED;
      } else if (typeof value === 'object' && value !== null) {
        result[key] = sanitizePayload(value);
      } else {
        result[key] = value;
      }
    }
    return result as T;
  }

  return data;
}
