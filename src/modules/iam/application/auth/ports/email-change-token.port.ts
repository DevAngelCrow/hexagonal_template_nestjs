export interface EmailChangeChallenge {
  id: string;
  user_id: string;
  person_id: string;
  new_email: string;
  token_hash: string;
  expires_at: string;
}

export abstract class EmailChangeTokenPort {
  abstract saveChallenge(
    challenge: EmailChangeChallenge,
    ttlMs: number,
  ): Promise<void>;
  abstract findChallengeById(id: string): Promise<EmailChangeChallenge | null>;
  abstract deleteChallenge(id: string, userId: string): Promise<void>;
}

