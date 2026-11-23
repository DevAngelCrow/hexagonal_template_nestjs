import { Module } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { IamModule } from '@/modules/iam/iam.module';
import { AuditModule } from '@/modules/audit/audit.module';
import { EmailProcessor } from '@/modules/iam/infrastructure/processors/email.processor';
import { PasswordResetEmailProcessor } from '@/modules/iam/infrastructure/processors/password-reset-email.processor';
import { EmailChangeProcessor } from '@/modules/iam/infrastructure/processors/email-change.processor';
import { AuditLogProcessor } from '@/modules/audit/infrastructure/processors/audit-log.processor';

@Module({
  imports: [AppModule, IamModule, AuditModule],
  providers: [
    EmailProcessor,
    PasswordResetEmailProcessor,
    EmailChangeProcessor,
    AuditLogProcessor,
  ],
})
export class WorkerModule {}
