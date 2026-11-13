import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  EmailChangeChallenge,
  EmailChangeTokenPort,
} from '@/modules/iam/application/auth/ports/email-change-token.port';

function isEmailChangeChallenge(value: unknown): value is EmailChangeChallenge {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return (
    typeof Reflect.get(value, 'id') === 'string' &&
    typeof Reflect.get(value, 'user_id') === 'string' &&
    typeof Reflect.get(value, 'person_id') === 'string' &&
    typeof Reflect.get(value, 'new_email') === 'string' &&
    typeof Reflect.get(value, 'token_hash') === 'string' &&
    typeof Reflect.get(value, 'expires_at') === 'string'
  );
}

@Injectable()
export class ImplEmailChangeTokenPort implements EmailChangeTokenPort {
  private static challengeKey(id: string): string {
    return `email-change:challenge:${id}`;
  }

  private static userActiveKey(userId: string): string {
    return `email-change:user:${userId}`;
  }

  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async saveChallenge(
    challenge: EmailChangeChallenge,
    ttlMs: number,
  ): Promise<void> {
    const previousChallengeId = await this.cacheManager.get<unknown>(
      ImplEmailChangeTokenPort.userActiveKey(challenge.user_id),
    );
    if (
      typeof previousChallengeId === 'string' &&
      previousChallengeId.length > 0 &&
      previousChallengeId !== challenge.id
    ) {
      await this.cacheManager.del(
        ImplEmailChangeTokenPort.challengeKey(previousChallengeId),
      );
    }

    await this.cacheManager.set(
      ImplEmailChangeTokenPort.challengeKey(challenge.id),
      challenge,
      ttlMs,
    );
    await this.cacheManager.set(
      ImplEmailChangeTokenPort.userActiveKey(challenge.user_id),
      challenge.id,
      ttlMs,
    );
  }

  async findChallengeById(id: string): Promise<EmailChangeChallenge | null> {
    const stored = await this.cacheManager.get<unknown>(
      ImplEmailChangeTokenPort.challengeKey(id),
    );
    if (!isEmailChangeChallenge(stored)) {
      return null;
    }
    return stored;
  }

  async deleteChallenge(id: string, userId: string): Promise<void> {
    await this.cacheManager.del(ImplEmailChangeTokenPort.challengeKey(id));
    await this.cacheManager.del(ImplEmailChangeTokenPort.userActiveKey(userId));
  }
}

