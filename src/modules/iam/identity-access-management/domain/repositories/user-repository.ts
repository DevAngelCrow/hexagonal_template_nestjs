import { User } from '../entities/user';
import { UserId } from '../value-objects/user-value-object/user-id';

export abstract class UserRepository {
  public abstract create(user: User): Promise<User>;
  public abstract update(user: User): Promise<void>;
  public abstract findById(id: UserId): Promise<User | null>;
  public abstract markEmailAsVerified(user_id: UserId): Promise<void>;
  public abstract checkPasswordHistory(
    id: UserId,
    plainPassword: string,
  ): Promise<void>;
  public abstract savePasswordHistory(
    id: UserId,
    oldHash: string,
  ): Promise<void>;
}
