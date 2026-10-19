import { PersonEmail } from '@/modules/iam/domain/value-objects/profile/person-value-object/person-email';
import { UserName } from '@/modules/iam/domain/value-objects/user/user-value-object/user-name';

export abstract class EmailSenderPort {
  abstract sendVerificationEmail(
    email: PersonEmail,
    user_name: UserName,
    verificationToken: {
      token: string;
      id: string;
    },
  ): Promise<void>;
  abstract sendForgottenPasswordEmail(
    email: PersonEmail,
    user_name: UserName,
    verificationToken: {
      token: string;
      id: string;
    },
  ): Promise<void>;
}
