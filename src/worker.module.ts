import { Module } from '@nestjs/common';
import { AppModule } from './app.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { EmailProcessor } from './modules/iam/auth/infrastructure/processors/email.processor';
import { PasswordResetEmailProcessor } from './modules/iam/auth/infrastructure/processors/password-reset-email.processor';

@Module({
  imports: [AppModule, AuthModule],
  providers: [EmailProcessor, PasswordResetEmailProcessor],
})
export class WorkerModule {}
