import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ConfigService } from '@nestjs/config';
import { TurnstileService } from '@/shared/infrastructure/services/turnstile.service';

const makeConfigService = (secretKey?: string): ConfigService =>
  ({
    get: vi.fn((key: string) =>
      key === 'CLOUDFLARE_TURNSTILE_SECRET_KEY' ? secretKey : undefined,
    ),
  }) as unknown as ConfigService;

describe('TurnstileService', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('returns false when token is missing without calling fetch', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService('secret-123'));
    const valid = await service.verifyToken('');

    expect(valid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns false when CLOUDFLARE_TURNSTILE_SECRET_KEY is not configured', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService(undefined));
    const valid = await service.verifyToken('cf-token-abc');

    expect(valid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('returns true and forwards secret, token, and remoteip on valid response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ success: true }),
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService('secret-key-xyz'));
    const valid = await service.verifyToken('valid-token', '203.0.113.10');

    expect(valid).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'secret=secret-key-xyz&response=valid-token&remoteip=203.0.113.10',
      }),
    );
  });

  it('returns false when siteverify returns non-ok HTTP status', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService('secret-key-xyz'));
    const valid = await service.verifyToken('token-1');

    expect(valid).toBe(false);
  });

  it('returns false when siteverify rejects the token', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService('secret-key-xyz'));
    const valid = await service.verifyToken('bad-token');

    expect(valid).toBe(false);
  });

  it('returns false when fetch throws a network error', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    globalThis.fetch = fetchMock as typeof globalThis.fetch;

    const service = new TurnstileService(makeConfigService('secret-key-xyz'));
    const valid = await service.verifyToken('token-1');

    expect(valid).toBe(false);
  });
});
