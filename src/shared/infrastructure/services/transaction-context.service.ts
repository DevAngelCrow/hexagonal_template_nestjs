import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { TransactionClient } from 'generated/prisma/internal/prismaNamespace';

export interface TransactionStore {
  client: TransactionClient;
  afterCommitHooks: Array<() => Promise<void> | void>;
}

@Injectable()
export class TransactionContextService {
  private readonly storage = new AsyncLocalStorage<TransactionStore>();

  getTransaction(): TransactionClient | undefined {
    return this.storage.getStore()?.client;
  }

  isInTransaction(): boolean {
    return this.storage.getStore() !== undefined;
  }

  addAfterCommitHook(hook: () => Promise<void> | void): void {
    const store = this.storage.getStore();
    if (store) {
      store.afterCommitHooks.push(hook);
    }
  }

  async run<T>(
    transaction: TransactionClient,
    afterCommitHooks: Array<() => Promise<void> | void>,
    callback: () => Promise<T>,
  ): Promise<T> {
    return await this.storage.run(
      { client: transaction, afterCommitHooks },
      async () => {
        return await callback();
      },
    );
  }
}
