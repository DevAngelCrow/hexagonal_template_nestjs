import { Injectable, Logger } from '@nestjs/common';
import { AfterCommitPort } from '@/shared/application/ports/after-commit.port';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';

@Injectable()
export class TransactionAfterCommitAdapter implements AfterCommitPort {
  private readonly logger = new Logger(TransactionAfterCommitAdapter.name);

  constructor(private readonly transactionContext: TransactionContextService) {}

  async run(hook: () => Promise<void> | void): Promise<void> {
    const safeHook = async (): Promise<void> => {
      try {
        await hook();
      } catch (error: unknown) {
        // Un efecto post-commit nunca debe invalidar una operación ya confirmada.
        this.logger.error(
          `Error ejecutando hook post-commit: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    };

    if (this.transactionContext.isInTransaction()) {
      this.transactionContext.addAfterCommitHook(safeHook);
      return;
    }

    await safeHook();
  }
}
