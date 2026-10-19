import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService implements OnModuleInit {
  private docsLoginHtmlCache: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.validateSecurityConfig();
  }

  getHello(): string {
    return 'Hello World!';
  }

  getDocsLoginHtml(): string {
    if (this.docsLoginHtmlCache) {
      return this.docsLoginHtmlCache;
    }

    const themeColors: Record<string, string> = {
      COLOR_PRIMARY:
        this.configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
      COLOR_SURFACE:
        this.configService.get<string>('EMAIL_COLOR_SURFACE') ?? '#e0e7ff',
      COLOR_CARD:
        this.configService.get<string>('EMAIL_COLOR_BACKGROUND_CARD') ?? '#eef2ff',
      COLOR_TEXT:
        this.configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
      COLOR_TEXT_MUTED:
        this.configService.get<string>('EMAIL_TEXT_MUTED') ?? '#a5b4fc',
      COLOR_BORDER:
        this.configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
    };

    const templatePath = path.join(
      __dirname,
      'shared',
      'infrastructure',
      'views',
      'docs-login.html',
    );

    const template = fs.readFileSync(templatePath, 'utf-8');

    this.docsLoginHtmlCache = Object.entries(themeColors).reduce(
      (html, [key, val]) =>
        html.replaceAll(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val),
      template,
    );

    return this.docsLoginHtmlCache;
  }

  clearDocsCookie(res: Response): void {
    const isDevelopment =
      this.configService.get<string>('NODE_ENV')?.trim() === 'development';

    res.clearCookie('docs_access', {
      httpOnly: true,
      sameSite: 'strict',
      secure: !isDevelopment,
      path: '/',
    });
  }

  validateSecurityConfig(): void {
    const isDevelopment =
      this.configService.get<string>('NODE_ENV')?.trim() === 'development';
    const enableApiDocs =
      this.configService.get<boolean>('ENABLE_API_DOCS') === true;

    const jwtRefreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ?? '';
    if (
      jwtRefreshSecret === 'your_jwt_refresh_secret_key' ||
      jwtRefreshSecret.length < 32
    ) {
      throw new Error(
        'JWT_REFRESH_SECRET must be set to a secure value of at least 32 characters. ' +
          'The default placeholder is not allowed in production.',
      );
    }

    if (!isDevelopment) {
      const jwtSecret = this.configService.get<string>('JWT_SECRET') ?? '';
      if (jwtSecret === jwtRefreshSecret) {
        throw new Error(
          'JWT_SECRET and JWT_REFRESH_SECRET must be different values.',
        );
      }
      if (this.configService.get<string>('SHOW_STACK_TRACE') === 'true') {
        throw new Error('SHOW_STACK_TRACE must not be true in production.');
      }
      if (enableApiDocs) {
        const swaggerUser = this.configService.get<string>('SWAGGER_USER');
        const swaggerPassword =
          this.configService.get<string>('SWAGGER_PASSWORD');
        if (!swaggerUser || !swaggerPassword) {
          throw new Error(
            'SWAGGER_USER and SWAGGER_PASSWORD must be set when ENABLE_API_DOCS is true in production.',
          );
        }
        if (swaggerPassword.length < 16) {
          throw new Error(
            'SWAGGER_PASSWORD must be at least 16 characters long in production.',
          );
        }
        const weakPasswords = new Set([
          'admin',
          'password',
          'postTest',
          'admin_docs',
          '123456',
          'changeme',
          'secret',
        ]);
        if (weakPasswords.has(swaggerPassword)) {
          throw new Error(
            'SWAGGER_PASSWORD matches a known weak/default value. Rotate it before going to production.',
          );
        }
      }
    }
  }
}
