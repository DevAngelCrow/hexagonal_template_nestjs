import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';

import { QUEUE_NAMES } from '@/shared/infrastructure/queues/queues.constants';
import { AuditModule } from '@/modules/audit/audit.module';
import { StorageModule } from '@/modules/storage/storage.module';
import { CatalogsModule } from '@/modules/catalogs/catalogs.module';
import { EventDispatcherModule } from '@/shared/infrastructure/event-dispatcher/event-dispatcher.module';

// Controllers
import { AuthController } from './infrastructure/controllers/auth.controller';
import { UserController } from './infrastructure/controllers/user.controller';
import { PersonController } from './infrastructure/controllers/person.controller';
import { AddressController } from './infrastructure/controllers/address.controller';
import { DocumentController } from './infrastructure/controllers/document.controller';
import { DocumentTypeController } from './infrastructure/controllers/document-type.controller';
import { CategoryPermissionsController } from './infrastructure/controllers/category-permissions.controller';
import { PermissionsController } from './infrastructure/controllers/permissions.controller';
import { RolController } from './infrastructure/controllers/rol.controller';
import { RouteController } from './infrastructure/controllers/route.controller';
import { MenuController } from './infrastructure/controllers/menu.controller';
import { UserRolController } from './infrastructure/controllers/user-rol.controller';

// Config Providers
import { commandHandlerProviders } from './infrastructure/config/commands-handlers.config';
import { queryHandlerProviders } from './infrastructure/config/queries-handlers.config';
import { repositories } from './infrastructure/config/repositories.config';
import { serviceProviders } from './infrastructure/config/services.config';

// Guards
import { LoginThrottleGuard } from './infrastructure/guards/login-throttle.guard';
import { CheckAuthenticatedUserGuard } from './infrastructure/guards/check-authenticated-user.guard';
import { PermissionsGuard } from './infrastructure/guards/permissions.guard';

// Subscribers
import {
  SendEmailVerificationSubscriber,
  SendPasswordResetSubscriber,
  InvalidateRoleCacheSubscriber,
  AuditIamSubscriber,
} from './infrastructure/subscribers';

@Module({
  imports: [
    CqrsModule,
    AuditModule,
    StorageModule,
    CatalogsModule,
    EventDispatcherModule,
    PassportModule,
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: (config.get<string>('JWT_EXPIRES_IN') ?? '1d') as any,
        },
      }),
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.SEND_EMAIL_VERIFICATION,
    }),
    BullModule.registerQueue({
      name: QUEUE_NAMES.SEND_PASSWORD_RESET,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.SEND_EMAIL_VERIFICATION,
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: QUEUE_NAMES.SEND_PASSWORD_RESET,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [
    AuthController,
    UserController,
    PersonController,
    AddressController,
    DocumentController,
    DocumentTypeController,
    CategoryPermissionsController,
    PermissionsController,
    RolController,
    RouteController,
    MenuController,
    UserRolController,
  ],
  providers: [
    ...repositories,
    ...serviceProviders,
    ...commandHandlerProviders,
    ...queryHandlerProviders,
    LoginThrottleGuard,
    CheckAuthenticatedUserGuard,
    PermissionsGuard,
    SendEmailVerificationSubscriber,
    SendPasswordResetSubscriber,
    InvalidateRoleCacheSubscriber,
    AuditIamSubscriber,
  ],
  exports: [
    ...repositories,
    ...serviceProviders,
    ...commandHandlerProviders,
    ...queryHandlerProviders,
    BullModule,
  ],
})
export class IamModule {}
