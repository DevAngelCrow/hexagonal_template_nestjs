import { describe, it, expect } from 'vitest';
import {
  extractClientIp,
  extractUserAgent,
} from '@/shared/infrastructure/http/utils/client-request-info';
import { buildContentDisposition } from '@/shared/infrastructure/http/utils/content-disposition';
import { parseTrustProxy } from '@/shared/infrastructure/setup/trust-proxy.setup';

describe('Shared HTTP Security & Evidence Utils', () => {
  describe('extractClientIp & extractUserAgent', () => {
    it('returns Express req.ip (normalized) and ignores unverified headers', () => {
      const req = {
        ip: '::ffff:198.51.100.42',
        socket: { remoteAddress: '127.0.0.1' },
        headers: {
          'x-forwarded-for': '1.2.3.4',
          'cf-connecting-ip': '5.6.7.8',
          'user-agent': '  Mozilla/5.0 TestAgent  ',
        },
      };

      expect(extractClientIp(req)).toBe('198.51.100.42');
      expect(extractUserAgent(req)).toBe('Mozilla/5.0 TestAgent');
    });

    it('falls back to socket.remoteAddress when req.ip is absent and truncates long user agents', () => {
      const longUa = 'A'.repeat(600);
      const req = {
        socket: { remoteAddress: '::1' },
        headers: { 'user-agent': longUa },
      };

      expect(extractClientIp(req)).toBe('::1');
      expect(extractUserAgent(req)).toHaveLength(512);
    });
  });

  describe('buildContentDisposition', () => {
    it('generates RFC 5987 UTF-8 filename* alongside safe ASCII fallback without control chars', () => {
      const header = buildContentDisposition(
        'inline',
        'documento-"María"-\r\nñ✓.pdf',
      );

      expect(header).toContain('inline; filename="documento-_Mar_a_-__.pdf"');
      expect(header).toContain("filename*=UTF-8''documento-_Mar%C3%ADa_-");
      expect(header).not.toMatch(/[\r\n]/);
    });
  });

  describe('parseTrustProxy', () => {
    it('parses boolean, numeric hop counts, and IP/subnet allowlists safely', () => {
      expect(parseTrustProxy(undefined)).toBe(false);
      expect(parseTrustProxy('')).toBe(false);
      expect(parseTrustProxy('false')).toBe(false);
      expect(parseTrustProxy('true')).toBe(true);
      expect(parseTrustProxy('1')).toBe(1);
      expect(parseTrustProxy('2')).toBe(2);
      expect(parseTrustProxy('loopback, 10.0.0.0/8')).toBe(
        'loopback, 10.0.0.0/8',
      );
    });
  });
});
