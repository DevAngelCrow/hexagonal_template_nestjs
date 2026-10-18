import { describe, it, expect, vi } from 'vitest';
import { UserRegisteredDomainEvent } from '../../domain/events/user-registered.domain-event';
import { UserLoggedInDomainEvent } from '../../domain/events/user-logged-in.domain-event';
import { UserPasswordResetDomainEvent } from '../../domain/events/user-password-reset.domain-event';
import { RolePermissionsUpdatedDomainEvent } from '../../domain/events/role-permissions-updated.domain-event';
import { SendEmailVerificationSubscriber } from './send-email-verification.subscriber';
import { SendPasswordResetSubscriber } from './send-password-reset.subscriber';
import { InvalidateRoleCacheSubscriber } from './invalidate-role-cache.subscriber';
import { AuditIamSubscriber } from './audit-iam.subscriber';
import { AuditAction } from '@/modules/audit/domain/enums/audit-action.enum';

describe('IAM Domain Events & Subscribers', () => {
  describe('SendEmailVerificationSubscriber', () => {
    it('enqueues a verification email job when user registers', async () => {
      const mockQueue = {
        add: vi.fn().mockResolvedValue({ id: 'job-1' }),
      };

      const subscriber = new SendEmailVerificationSubscriber(mockQueue as any);
      const event = new UserRegisteredDomainEvent(
        'user-1',
        'test@example.com',
        'johndoe',
        'person-1',
      );

      await subscriber.handle(event);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send_email_verification',
        {
          userId: 'user-1',
          email: 'test@example.com',
          userName: 'johndoe',
        },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });

  describe('SendPasswordResetSubscriber', () => {
    it('enqueues a password reset email job', async () => {
      const mockQueue = {
        add: vi.fn().mockResolvedValue({ id: 'job-2' }),
      };

      const subscriber = new SendPasswordResetSubscriber(mockQueue as any);
      const event = new UserPasswordResetDomainEvent('user-1', 'reset@example.com');

      await subscriber.handle(event);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'send_password_reset',
        {
          userId: 'user-1',
          email: 'reset@example.com',
        },
        expect.objectContaining({ attempts: 3 }),
      );
    });
  });

  describe('InvalidateRoleCacheSubscriber', () => {
    it('invalidates redis role cache on RolePermissionsUpdatedDomainEvent', async () => {
      const mockCache = {
        fetch: vi.fn(),
        invalidate: vi.fn().mockResolvedValue(undefined),
      };

      const subscriber = new InvalidateRoleCacheSubscriber(mockCache as any);
      const event = new RolePermissionsUpdatedDomainEvent('role-admin', 'ADMIN', [
        'perm-1',
        'perm-2',
      ]);

      await subscriber.handle(event);

      expect(mockCache.invalidate).toHaveBeenCalledWith('role_permissions:role-admin');
      expect(mockCache.invalidate).toHaveBeenCalledWith('role_permissions:ADMIN');
    });
  });

  describe('AuditIamSubscriber', () => {
    it('forwards UserRegisteredDomainEvent to AuditLogService', () => {
      const mockAuditService = {
        log: vi.fn(),
      };

      const subscriber = new AuditIamSubscriber(mockAuditService as any);
      const event = new UserRegisteredDomainEvent(
        'user-123',
        'user@test.com',
        'alice',
      );

      subscriber.handle(event);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.REGISTER,
          user_id: 'user-123',
          user_name: 'alice',
          entity_type: 'User',
        }),
      );
    });

    it('forwards UserLoggedInDomainEvent to AuditLogService', () => {
      const mockAuditService = {
        log: vi.fn(),
      };

      const subscriber = new AuditIamSubscriber(mockAuditService as any);
      const event = new UserLoggedInDomainEvent(
        'user-123',
        'alice',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      subscriber.handle(event);

      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: AuditAction.LOGIN_SUCCESS,
          user_id: 'user-123',
          ip_address: '192.168.1.1',
        }),
      );
    });
  });
});
