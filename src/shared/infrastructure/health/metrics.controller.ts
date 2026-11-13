import {
  Controller,
  ForbiddenException,
  Get,
  Req,
  Res,
  SetMetadata,
  UnauthorizedException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiExcludeController } from '@nestjs/swagger';
import { register } from 'prom-client';
import { timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';

function constantTimeTokenMatch(provided: string, expected: string): boolean {
  const providedBuf = Buffer.from(provided, 'utf8');
  const expectedBuf = Buffer.from(expected, 'utf8');
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
}

@ApiExcludeController()
@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
@SetMetadata('isPublic', true)
export class MetricsController {
  constructor(private readonly configService: ConfigService) {}

  @Get()
  @SetMetadata('isPublic', true)
  async index(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    const configuredToken = this.configService
      .get<string>('METRICS_TOKEN')
      ?.trim();
    const isProduction =
      this.configService.get<string>('NODE_ENV')?.trim() === 'production';

    if (configuredToken && configuredToken.length > 0) {
      const authHeader = req.headers['authorization'];
      const provided =
        typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
          ? authHeader.slice(7).trim()
          : '';
      if (!provided || !constantTimeTokenMatch(provided, configuredToken)) {
        throw new UnauthorizedException('Invalid metrics token');
      }
    } else if (isProduction) {
      throw new ForbiddenException(
        'Metrics endpoint disabled when METRICS_TOKEN is not configured',
      );
    }

    res.header('Content-Type', register.contentType);
    return await register.metrics();
  }
}
