import { describe, it, expect } from 'vitest';
import { sanitizePayload } from './sanitize-payload.util';

describe('sanitizePayload', () => {
  it('returns primitives, null, and undefined unchanged', () => {
    expect(sanitizePayload(null)).toBeNull();
    expect(sanitizePayload(undefined)).toBeUndefined();
    expect(sanitizePayload('hello')).toBe('hello');
    expect(sanitizePayload(123)).toBe(123);
    expect(sanitizePayload(true)).toBe(true);
  });

  it('redacts sensitive keys in flat objects', () => {
    const input = {
      username: 'john',
      password: 'secretPassword123',
      token: 'jwt-token-xyz',
      email: 'john@example.com',
    };

    const output = sanitizePayload(input);

    expect(output).toEqual({
      username: 'john',
      password: '[REDACTED]',
      token: '[REDACTED]',
      email: 'john@example.com',
    });
  });

  it('redacts case-insensitively and handles nested objects and arrays', () => {
    const input = {
      user: {
        id: '123',
        CURRENT_PASSWORD: 'oldPassword!',
        roles: ['admin', 'user'],
      },
      tokens: [
        { refreshToken: 'token-1' },
        { regularKey: 'value-2' },
      ],
    };

    const output = sanitizePayload(input);

    expect(output).toEqual({
      user: {
        id: '123',
        CURRENT_PASSWORD: '[REDACTED]',
        roles: ['admin', 'user'],
      },
      tokens: [
        { refreshToken: '[REDACTED]' },
        { regularKey: 'value-2' },
      ],
    });
  });
});
