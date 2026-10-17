import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '@/shared/infrastructure/db/prisma.service';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import { from, lastValueFrom, Observable } from 'rxjs';
import { TRANSACTIONAL_KEY } from '@/shared/infrastructure/decorators/transactional.decorator';
import { TransactionClient } from 'generated/prisma/internal/prismaNamespace';

@Injectable()
export class TransactionInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly transactionContext: TransactionContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const isTransactional = this.reflector.get<boolean>(
      TRANSACTIONAL_KEY,
      context.getHandler(),
    );
    if (!isTransactional) {
      return next.handle();
    }
    const executeTransaction = async (): Promise<unknown> => {
      const afterCommitHooks: Array<() => Promise<void> | void> = [];
      const result: unknown = await this.prisma.$transaction(
        async (prisma: TransactionClient): Promise<unknown> => {
          const transactionResult: unknown = await this.transactionContext.run(
            prisma,
            afterCommitHooks,
            async (): Promise<unknown> => {
              return await lastValueFrom(next.handle());
            },
          );
          return transactionResult;
        },
      );
      // Run after-commit hooks sequentially after the transaction commits successfully
      for (const hook of afterCommitHooks) {
        await hook();
      }
      return result;
    };
    return from(executeTransaction());
  }
}
