import { Module } from '@nestjs/common';
import { AppModule } from '@/app.module';
import { IamModule } from '@/modules/iam/iam.module';
import { EmailProcessor } from '@/modules/iam/infrastructure/processors/email.processor';
import { PasswordResetEmailProcessor } from '@/modules/iam/infrastructure/processors/password-reset-email.processor';

@Module({
  imports: [AppModule, IamModule],
  providers: [EmailProcessor, PasswordResetEmailProcessor],
})
export class WorkerModule {}
