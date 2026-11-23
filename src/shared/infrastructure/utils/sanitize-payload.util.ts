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

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date)
  );
}

export function sanitizeRecord(
  record: Record<string, unknown>,
  seen: WeakSet<object> = new WeakSet(),
): Record<string, unknown> {
  if (seen.has(record)) {
    return {};
  }
  seen.add(record);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = REDACTED;
    } else {
      result[key] = sanitizePayload(value, seen);
    }
  }
  return result;
}

export function sanitizePayload(
  data: unknown,
  seen: WeakSet<object> = new WeakSet(),
): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (Array.isArray(data)) {
    if (seen.has(data)) {
      return [];
    }
    seen.add(data);
    return data.map((item) => sanitizePayload(item, seen));
  }

  if (isPlainRecord(data)) {
    return sanitizeRecord(data, seen);
  }

  return data;
}
