import { HttpException, HttpStatus } from '@nestjs/common';
import { DomainException } from '@/shared/domain/exceptions/domain.exception';
import { ApplicationException } from '@/shared/application/exceptions/application.exception';
import { InfrastructureException } from '@/shared/infrastructure/exceptions/infrastructure.exception';

// Excepciones de Dominio
import { NotFoundException } from '@/shared/domain/exceptions/not-found.exception';
import { ConflictException } from '@/shared/domain/exceptions/conflict-exception';
import { ValidationException } from '@/shared/domain/exceptions/validation.exception';
import { BadRequestException } from '@/shared/domain/exceptions/bad-request.exception';
import { AccountLockedException } from '@/shared/domain/exceptions/account-locked.exception';

// Excepciones de Aplicación
import { UnauthorizedException } from '@/shared/application/exceptions/unauthorized.exception';
import { ForbiddenException } from '@/shared/application/exceptions/forbidden.exception';

// Excepciones de Infraestructura
import { DatabaseException } from '@/shared/infrastructure/exceptions/database.exception';
import { ExternalServiceException } from '@/shared/infrastructure/exceptions/external-service.exception';
import { PayloadTooLargeException } from '@/shared/infrastructure/exceptions/payload-too-large.exception';
import { Prisma } from 'generated/prisma/client';

export class ExceptionMapper {
  static toHttpException(error: unknown, path?: string): HttpException {
    // 1. Manejo de error por payload demasiado grande (Express / BodyParser)
    if (
      error &&
      typeof error === 'object' &&
      'type' in error &&
      error.type === 'entity.too.large'
    ) {
      return this.mapInfrastructureException(new PayloadTooLargeException());
    }

    // 2. Mapeo automático de errores conocidos de Prisma
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      const translated = this.translatePrismaError(error);
      if (translated) {
        return this.toHttpException(translated, path);
      }
    }

    // 3. Excepciones por capas (Domain, Application, Infrastructure)
    if (error instanceof DomainException) {
      return this.mapDomainException(error);
    }

    if (error instanceof ApplicationException) {
      return this.mapApplicationException(error);
    }

    if (error instanceof InfrastructureException) {
      return this.mapInfrastructureException(error);
    }

    // 4. Cualquier error desconocido no controlado
    return this.mapUnknownException(error);
  }

  // --- Mapeo de Dominio ---
  private static mapDomainException(error: DomainException): HttpException {
    const status = this.resolveDomainStatus(error);

    const payload: Record<string, unknown> = {
      statusCode: status,
      message: error.message,
      error: 'DOMAIN_ERROR',
      code: error.code || 'DOMAIN_RULE_VIOLATION',
      errorCode: error.errorCode,
    };

    if (error instanceof AccountLockedException) {
      payload.retry_after = error.retryAfter.toISOString();
    }

    return new HttpException(payload, status);
  }

  private static resolveDomainStatus(error: DomainException): HttpStatus {
    if (error instanceof NotFoundException) return HttpStatus.NOT_FOUND;
    if (error instanceof ConflictException) return HttpStatus.CONFLICT;
    if (error instanceof AccountLockedException) return HttpStatus.LOCKED; // 423
    if (error instanceof ValidationException || error instanceof BadRequestException) {
      return HttpStatus.BAD_REQUEST;
    }
    return HttpStatus.BAD_REQUEST;
  }

  // --- Mapeo de Aplicación ---
  private static mapApplicationException(error: ApplicationException): HttpException {
    const status = this.resolveApplicationStatus(error);

    return new HttpException(
      {
        statusCode: status,
        message: error.message,
        error: 'APPLICATION_ERROR',
        code: error.code || 'APPLICATION_ERROR',
        errorCode: error.errorCode,
      },
      status,
    );
  }

  private static resolveApplicationStatus(error: ApplicationException): HttpStatus {
    if (error instanceof UnauthorizedException) return HttpStatus.UNAUTHORIZED;
    if (error instanceof ForbiddenException) return HttpStatus.FORBIDDEN;
    return HttpStatus.FORBIDDEN;
  }

  // --- Mapeo de Infraestructura ---
  private static mapInfrastructureException(error: InfrastructureException): HttpException {
    const status = this.resolveInfrastructureStatus(error);

    return new HttpException(
      {
        statusCode: status,
        message: error.message,
        error: 'INFRASTRUCTURE_ERROR',
        code: error.code || 'INFRASTRUCTURE_ERROR',
        errorCode: error.errorCode,
      },
      status,
    );
  }

  private static resolveInfrastructureStatus(error: InfrastructureException): HttpStatus {
    if (error instanceof DatabaseException) return HttpStatus.SERVICE_UNAVAILABLE;
    if (error instanceof ExternalServiceException) return HttpStatus.BAD_GATEWAY;
    if (error instanceof PayloadTooLargeException) return HttpStatus.PAYLOAD_TOO_LARGE;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  // --- Mapeo de Errores Desconocidos ---
  private static mapUnknownException(_error: unknown): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Internal server error',
        error: 'INTERNAL_ERROR',
        code: 'INTERNAL_SERVER_ERROR',
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  // --- Traducción de códigos Prisma ---
  private static translatePrismaError(
    error: Prisma.PrismaClientKnownRequestError,
  ): Error | null {
    const target = this.formatPrismaTarget(error.meta?.target);
    switch (error.code) {
      case 'P2002':
        return new ConflictException(
          target
            ? `A record with the same ${target} already exists`
            : 'A record with these values already exists',
        );
      case 'P2025':
        return new NotFoundException(
          'Record',
          typeof error.meta?.cause === 'string'
            ? error.meta.cause
            : 'requested',
        );
      case 'P2003':
        return new BadRequestException(
          target
            ? `Referenced record does not exist for ${target}`
            : 'Referenced record does not exist',
        );
      case 'P2014':
        return new BadRequestException('The change would violate a required relation');
      default:
        return null;
    }
  }

  private static formatPrismaTarget(target: unknown): string | null {
    if (!target) return null;
    if (Array.isArray(target)) return target.join(', ');
    if (typeof target === 'string') return target;
    return null;
  }
}
