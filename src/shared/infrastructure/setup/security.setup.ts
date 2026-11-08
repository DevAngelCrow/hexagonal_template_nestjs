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
  const defaultDevOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];

  const allowedOrigins: string[] = [
    clientUrl,
    ...(isDevelopment ? defaultDevOrigins : []),
    ...(corsOriginsEnv
      ? corsOriginsEnv
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : []),
  ];

  const uniqueOrigins = Array.from(new Set(allowedOrigins));

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      // Allow requests with no origin (curl, server-to-server, etc.)
      if (!requestOrigin) return callback(null, true);
      if (uniqueOrigins.includes(requestOrigin)) return callback(null, true);
      // In development, permit any localhost/127.0.0.1 port
      if (
        isDevelopment &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin)
      ) {
        return callback(null, true);
      }
      callback(new Error(`Origin ${requestOrigin} not allowed by CORS`));
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'idempotency-key',
      'X-Request-ID',
      'x-request-id',
      'Accept',
      'Origin',
      'X-Requested-With',
    ],
    exposedHeaders: [
      'X-Request-ID',
      'X-Idempotent-Replayed',
      'Content-Disposition',
    ],
    credentials: true,
  });
}
