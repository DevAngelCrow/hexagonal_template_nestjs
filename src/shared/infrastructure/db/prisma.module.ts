import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
@Global()
@Module({
    providers: [PrismaService, TransactionContextService],
    exports: [PrismaService, TransactionContextService],
})
export class PrismaModule { }
