import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionAfterCommitAdapter } from './transaction-after-commit.adapter';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

describe('TransactionAfterCommitAdapter', () => {
  let adapter: TransactionAfterCommitAdapter;
  let transactionContext: TransactionContextService;

  beforeEach(() => {
    transactionContext = new TransactionContextService();
    adapter = new TransactionAfterCommitAdapter(transactionContext);
  });

  it('executes hook immediately when there is no active transaction', async () => {
    const hook = vi.fn().mockResolvedValue(undefined);

    await adapter.run(hook);

    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('defers hook registration to transactionContext when inside a transaction', async () => {
    const registeredHooks: Array<() => Promise<void> | void> = [];
    vi.spyOn(transactionContext, 'isInTransaction').mockReturnValue(true);
    vi.spyOn(transactionContext, 'addAfterCommitHook').mockImplementation(
      (hook) => {
        registeredHooks.push(hook);
      },
    );

    const hook = vi.fn().mockResolvedValue(undefined);
    await adapter.run(hook);

    expect(hook).not.toHaveBeenCalled();
    expect(registeredHooks).toHaveLength(1);

    await registeredHooks[0]();
    expect(hook).toHaveBeenCalledTimes(1);
  });

  it('catches and absorbs errors thrown inside post-commit hooks without rejecting', async () => {
    const failingHook = vi
      .fn()
      .mockRejectedValue(new Error('External side-effect error'));

    await expect(adapter.run(failingHook)).resolves.toBeUndefined();
    expect(failingHook).toHaveBeenCalledTimes(1);
  });
});
