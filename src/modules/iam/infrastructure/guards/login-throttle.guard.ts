import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { extractClientIp } from '@/shared/infrastructure/http/utils/client-request-info';

@Injectable()
export class LoginThrottleGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const body = req['body'];
    const isRecord = (v: unknown): v is Record<string, unknown> =>
      typeof v === 'object' && v !== null;
    const userName =
      isRecord(body) && typeof body.user_name === 'string'
        ? body.user_name.trim().toLowerCase()
        : undefined;

    const rawIp = typeof req.ip === 'string' ? req.ip : undefined;
    const rawHeaders = isRecord(req['headers']) ? req['headers'] : {};
    const ua = rawHeaders['user-agent'];
    const ip =
      extractClientIp({
        ip: rawIp,
        headers: {
          'user-agent':
            typeof ua === 'string' || Array.isArray(ua) ? ua : undefined,
        },
      }) ?? 'unknown-ip';

    if (!userName) return Promise.resolve(ip);

    return Promise.resolve(`${ip}:${userName}`);
  }
}
