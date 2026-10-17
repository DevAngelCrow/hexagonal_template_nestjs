export abstract class LoggerPort {
  abstract log(message: string, context?: Record<string, unknown> | string): void;
  abstract error(message: string, trace?: string, context?: Record<string, unknown> | string): void;
  abstract warn(message: string, context?: Record<string, unknown> | string): void;
  abstract debug?(message: string, context?: Record<string, unknown> | string): void;
}
