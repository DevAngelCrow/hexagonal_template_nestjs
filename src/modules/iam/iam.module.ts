import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from './auth/auth.module';
import { IdentityAccessManagementModule } from './identity-access-management/identity-access-management.module';
import { ProfileModule } from './profile/profile.module';
import { SecurityModule } from './security/security.module';
import {
  SendEmailVerificationSubscriber,
  SendPasswordResetSubscriber,
  InvalidateRoleCacheSubscriber,
  AuditIamSubscriber,
} from './infrastructure/subscribers';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    CqrsModule,
    AuditModule,
    AuthModule,
    IdentityAccessManagementModule,
    ProfileModule,
    SecurityModule,
  ],
  providers: [
    SendEmailVerificationSubscriber,
    SendPasswordResetSubscriber,
    InvalidateRoleCacheSubscriber,
    AuditIamSubscriber,
  ],
  exports: [
    AuthModule,
    IdentityAccessManagementModule,
    ProfileModule,
    SecurityModule,
  ],
})
export class IamModule {}
