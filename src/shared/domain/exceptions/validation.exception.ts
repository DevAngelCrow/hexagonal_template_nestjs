import { ErrorCode } from "@/shared/domain/enums/error-code.enum";
import { DomainException } from "@/shared/domain/exceptions/domain.exception";


export class ValidationException extends DomainException {
    constructor(message: string) {
        super(message, ErrorCode.VALIDATION_FAILED);
        this.name = 'ValidationException';
    }
}
