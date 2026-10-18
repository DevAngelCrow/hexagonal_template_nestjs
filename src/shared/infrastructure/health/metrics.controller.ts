import {
  Controller,
  Get,
  Res,
  SetMetadata,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { register } from 'prom-client';
import type { Response } from 'express';

@ApiExcludeController()
@Controller({ path: 'metrics', version: VERSION_NEUTRAL })
@SetMetadata('isPublic', true)
export class MetricsController {
  @Get()
  @SetMetadata('isPublic', true)
  async index(@Res({ passthrough: true }) res: Response): Promise<string> {
    res.header('Content-Type', register.contentType);
    return await register.metrics();
  }
}
