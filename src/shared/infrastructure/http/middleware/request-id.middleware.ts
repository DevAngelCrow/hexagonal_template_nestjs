import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';

export type RequestWithId = Request & { id: string };

const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9._-]{1,64}$/;

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: RequestWithId, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const trimmed = typeof incoming === 'string' ? incoming.trim() : '';
    const id = SAFE_REQUEST_ID_REGEX.test(trimmed) ? trimmed : randomUUID();

    req.id = id;
    res.setHeader('X-Request-ID', id);
    next();
  }
}
