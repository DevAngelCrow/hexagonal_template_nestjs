import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TurnstileOutcome {
  success: boolean;
  'error-codes'?: string[];
}

function isTurnstileOutcome(data: unknown): data is TurnstileOutcome {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  return 'success' in data && typeof Reflect.get(data, 'success') === 'boolean';
}

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string | undefined;

  constructor(private readonly configService: ConfigService) {
    this.secretKey = this.configService.get<string>(
      'CLOUDFLARE_TURNSTILE_SECRET_KEY',
    );
  }

  async verifyToken(token?: string, remoteIp?: string): Promise<boolean> {
    if (!token) {
      this.logger.warn('Token de Cloudflare Turnstile ausente en la petición');
      return false;
    }

    if (!this.secretKey) {
      this.logger.error(
        'CLOUDFLARE_TURNSTILE_SECRET_KEY no configurado en el servidor',
      );
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append('secret', this.secretKey);
      formData.append('response', token);
      if (remoteIp) {
        formData.append('remoteip', remoteIp);
      }

      const response = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        },
      );

      if (!response.ok) {
        this.logger.error(
          `Respuesta HTTP no satisfactoria de Turnstile siteverify: ${response.status}`,
        );
        return false;
      }

      const rawOutcome: unknown = await response.json();
      if (!isTurnstileOutcome(rawOutcome) || !rawOutcome.success) {
        const errorCodes =
          isTurnstileOutcome(rawOutcome) &&
          Array.isArray(rawOutcome['error-codes'])
            ? JSON.stringify(rawOutcome['error-codes'])
            : 'desconocido';
        this.logger.warn(
          `Validación Turnstile fallida. Códigos de error: ${errorCodes}`,
        );
        return false;
      }
      return true;
    } catch (error) {
      this.logger.error(
        'Error al contactar con la API de Cloudflare Turnstile:',
        error,
      );
      return false;
    }
  }
}
