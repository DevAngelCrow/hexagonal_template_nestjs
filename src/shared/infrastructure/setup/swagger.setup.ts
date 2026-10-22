import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { verify as jwtVerify } from 'jsonwebtoken';

export function setupSwagger(
  app: INestApplication,
  configService: ConfigService,
): void {
  const isDevelopment =
    configService.get<string>('NODE_ENV')?.trim() === 'development';

  const config = new DocumentBuilder()
    .setTitle('Backend template api')
    .setDescription('API Docs')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        in: 'header',
        description: 'Ingrese el JWT',
      },
      'JWT-auth',
    )
    .build();

  // Looser CSP only for docs routes — Swagger/Scalar inject inline scripts
  // and styles, and Scalar pulls assets from cdn.jsdelivr.net.
  const docsCsp = helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'script-src': [
          "'self'",
          "'unsafe-inline'",
          'https://cdn.jsdelivr.net',
        ],
        'style-src': [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        'img-src': ["'self'", 'data:', 'https://cdn.jsdelivr.net'],
        'font-src': ["'self'", 'https://fonts.gstatic.com'],
      },
    },
    strictTransportSecurity: isDevelopment
      ? false
      : {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
  });

  app.use(
    [
      '/api/docs',
      '/api/docs-json',
      '/api/docs/login',
      '/api/docs/logout',
      '/docs',
    ],
    docsCsp,
  );

  const jwtSecret = configService.get<string>('JWT_SECRET') ?? '';

  const themeColors: Record<string, string> = {
    COLOR_PRIMARY:
      configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
    COLOR_SURFACE:
      configService.get<string>('EMAIL_COLOR_SURFACE') ?? '#e0e7ff',
    COLOR_CARD:
      configService.get<string>('EMAIL_COLOR_BACKGROUND_CARD') ?? '#eef2ff',
    COLOR_TEXT: configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
    COLOR_TEXT_MUTED:
      configService.get<string>('EMAIL_TEXT_MUTED') ?? '#a5b4fc',
    COLOR_BORDER:
      configService.get<string>('EMAIL_COLOR_PRIMARY') ?? '#059669',
  };

  const templatePath = path.join(
    __dirname,
    '..',
    'views',
    'docs-login.html',
  );

  const docsLoginHtml = Object.entries(themeColors).reduce(
    (html, [key, val]) =>
      html.replaceAll(new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g'), val),
    fs.readFileSync(templatePath, 'utf-8'),
  );

  // ── Login page ──────────────────────────────────────────────────────────
  app.use('/api/docs/login', (req: Request, res: Response) => {
    if (req.method !== 'GET') {
      return res.status(405).send('Method Not Allowed');
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(docsLoginHtml);
  });

  // ── Logout ───────────────────────────────────────────────────────────────
  app.use('/api/docs/logout', (req: Request, res: Response) => {
    if (req.method !== 'GET') {
      return res.status(405).send('Method Not Allowed');
    }
    res.clearCookie('docs_access', {
      httpOnly: true,
      sameSite: 'strict',
      secure: !isDevelopment,
      path: '/',
    });
    res.redirect('/api/docs/login');
  });

  // ── JWT-cookie middleware ────────────────────────────────────────────────
  const docsJwtCookieMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    const cookieHeader = req.headers['cookie'] ?? '';
    const cookies: Record<string, string> = Object.fromEntries(
      cookieHeader.split(';').flatMap((pair) => {
        const idx = pair.indexOf('=');
        if (idx === -1) return [];
        const k = pair.slice(0, idx).trim();
        const v = decodeURIComponent(pair.slice(idx + 1).trim());
        return [[k, v]];
      }),
    );

    const token = cookies['docs_access'];
    if (!token) {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }

    try {
      jwtVerify(token, jwtSecret);
      return next();
    } catch {
      const redirect = encodeURIComponent(req.originalUrl);
      return res.redirect(`/api/docs/login?redirect=${redirect}`);
    }
  };

  app.use(['/api/docs', '/api/docs-json', '/docs'], docsJwtCookieMiddleware);

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'API Docs - Swagger UI',
    swaggerOptions: {
      persistAuthorization: true,
    },
    jsonDocumentUrl: 'api/docs-json',
  });

  app.use(
    '/docs',
    apiReference({
      spec: {
        content: document,
      },
      theme: 'bluePlanet',
      layout: 'modern',
      metaData: {
        title: 'Backend Template API - Scalar',
        description: 'Documentación interactiva de la API',
        favicon: 'https://docs.scalar.com/favicon.png',
      },
    }),
  );
}
