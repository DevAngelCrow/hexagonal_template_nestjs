import { ApplicationException } from '@/shared/application/exceptions/application.exception';
import { ErrorCode } from '@/shared/domain/enums/error-code.enum';

export class ForbiddenException extends ApplicationException {
  constructor(message: string = 'Forbidden access') {
    super(message, 'FORBIDDEN_EXCEPTION', ErrorCode.FORBIDDEN);
  }
}
