import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
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
    const headers = req['headers'];
    const forwardedFor = isRecord(headers)
      ? headers['x-forwarded-for']
      : undefined;
    const forwardedIp = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0]?.trim()
        : undefined;
    const ip =
      forwardedIp || (typeof req.ip === 'string' ? req.ip : 'unknown-ip');

    if (!userName) return Promise.resolve(ip);

    return Promise.resolve(`${ip}:${userName}`);
  }
}
