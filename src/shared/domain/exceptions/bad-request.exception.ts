import { DomainException } from "@/shared/domain/exceptions/domain.exception";
import { ErrorCode } from "@/shared/domain/enums/error-code.enum";

export class BadRequestException extends DomainException {
  constructor(message: string) {
    super(message, ErrorCode.VALIDATION_FAILED);
  }
}
