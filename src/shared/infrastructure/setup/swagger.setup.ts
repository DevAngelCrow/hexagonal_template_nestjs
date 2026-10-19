import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import helmet from 'helmet';

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
