import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { TransactionContextService } from '@/shared/infrastructure/services/transaction-context.service';
import { SequenceGeneratorPort } from '@/shared/application/ports/sequence-generator.port';
import { SequenceGeneratorService } from '@/shared/infrastructure/services/sequence-generator.service';

@Global()
@Module({
  providers: [
    PrismaService,
    TransactionContextService,
    {
      provide: SequenceGeneratorPort,
      useClass: SequenceGeneratorService,
    },
    SequenceGeneratorService,
  ],
  exports: [
    PrismaService,
    TransactionContextService,
    SequenceGeneratorPort,
    SequenceGeneratorService,
  ],
})
export class PrismaModule {}
