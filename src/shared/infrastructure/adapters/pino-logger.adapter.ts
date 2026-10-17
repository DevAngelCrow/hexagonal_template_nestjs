import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { LoggerPort } from '@/shared/application/ports/logger.port';

@Injectable()
export class PinoLoggerAdapter implements LoggerPort {
  constructor(private readonly logger: PinoLogger) {}

  log(message: string, context?: Record<string, unknown> | string): void {
    if (typeof context === 'object' && context !== null) {
      this.logger.info(context, message);
    } else {
      this.logger.info({ context }, message);
    }
  }

  error(message: string, trace?: string, context?: Record<string, unknown> | string): void {
    const payload =
      typeof context === 'object' && context !== null
        ? { ...context, trace }
        : { context, trace };
    this.logger.error(payload, message);
  }

  warn(message: string, context?: Record<string, unknown> | string): void {
    if (typeof context === 'object' && context !== null) {
      this.logger.warn(context, message);
    } else {
      this.logger.warn({ context }, message);
    }
  }

  debug(message: string, context?: Record<string, unknown> | string): void {
    if (typeof context === 'object' && context !== null) {
      this.logger.debug(context, message);
    } else {
      this.logger.debug({ context }, message);
    }
  }
}
