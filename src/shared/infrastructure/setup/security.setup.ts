import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import compression from 'compression';

export function setupSecurity(
  app: INestApplication,
  configService: ConfigService,
): void {
  const clientUrl =
    configService.get<string>('CLIENT_URL') || 'http://localhost:5174';
  const isDevelopment =
    configService.get<string>('NODE_ENV')?.trim() === 'development';

  // gzip/deflate for JSON responses; defaults compress when size ≥1KB.
  app.use(compression());

  // Global strict CSP — applies to the API and to anything not under /docs.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          'script-src': ["'self'"],
          'style-src': ["'self'"],
          'img-src': ["'self'", 'data:'],
          'font-src': ["'self'"],
        },
      },
      strictTransportSecurity: isDevelopment
        ? false
        : {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
          },
    }),
  );

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), fullscreen=(self)',
    );
    next();
  });

  const corsOriginsEnv = configService.get<string>('CORS_ORIGINS');
  const allowedOrigins: string[] = [
    clientUrl,
    ...(corsOriginsEnv
      ? corsOriginsEnv
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : []),
  ];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true
  });
}
