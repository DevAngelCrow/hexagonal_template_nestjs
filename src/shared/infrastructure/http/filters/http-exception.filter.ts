import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { RequestWithId } from '@/shared/infrastructure/http/middleware/request-id.middleware';
import { ExceptionMapper } from '@/shared/infrastructure/http/mappers/exception-mapper';
import { ErrorResponse } from '@/shared/infrastructure/interfaces/error-response.filter.interface';


@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);
    private readonly isDevelopment: boolean;
    private readonly showStackTrace: boolean;

    constructor(private readonly configService?: ConfigService) {
        this.isDevelopment =
            this.configService?.get('NODE_ENV') === 'development' ||
            process.env.NODE_ENV === 'development';
        this.showStackTrace =
            this.configService?.get('SHOW_STACK_TRACE') === 'true' &&
            this.isDevelopment;
    }

    catch(exception: unknown, host: ArgumentsHost): void {
        const context = host.switchToHttp();
        const response = context.getResponse<Response>();
        const request = context.getRequest<RequestWithId>();
        const requestId = request.id;

        // Descartar escaneos de bots comunes sin procesar
        if (request.url?.includes('/.well-known/')) {
            response.status(HttpStatus.NOT_FOUND).send();
            return;
        }

        // 1. Normalizar cualquier error a HttpException usando el Mapper
        let httpException: HttpException;
        if (exception instanceof HttpException) {
            httpException = exception;
        } else {
            httpException = ExceptionMapper.toHttpException(exception, request.url);
        }

        const status = httpException.getStatus();
        const exceptionResponse = httpException.getResponse();

        // 2. Construir la respuesta final con la interfaz ErrorResponse
        let responseBody: ErrorResponse;
        const baseMetadata = {
            timestamp: new Date().toISOString(),
            path: request.url,
            requestId,
        };

        if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
            responseBody = {
                statusCode: status,
                message: 'message' in exceptionResponse ? String(exceptionResponse.message) : 'Error',
                ...baseMetadata,
                ...exceptionResponse,
            };
        } else {
            responseBody = {
                statusCode: status,
                message: String(exceptionResponse),
                ...baseMetadata,
            };
        }

        // 3. Adjuntar Stacktrace solo en desarrollo si está habilitado
        if (this.showStackTrace && exception instanceof Error && exception.stack) {
            responseBody.stack = exception.stack;
            responseBody.originalError = {
                name: exception.name,
                message: exception.message,
            };
        }

        // 4. Métricas y Logs estructurados
        this.logException(exception, request, status);

        // if (status >= 500) {
        //     http5xxTotal.inc({ status: String(status) });
        // } else if (status >= 400) {
        //     http4xxTotal.inc({ status: String(status) });
        // }

        response.status(status).json(responseBody);
    }

    private logException(
        exception: unknown,
        request: RequestWithId,
        status: number,
    ): void {
        const errorName =
            exception instanceof Error ? exception.name : 'UnknownError';
        const errorMessage =
            exception instanceof Error ? exception.message : String(exception);
        const errorStack = exception instanceof Error ? exception.stack : undefined;

        const logContext = {
            requestId: request.id,
            method: request.method,
            url: request.url,
            status,
            errorName,
            errorMessage,
            user:
                'user' in request &&
                    request.user &&
                    typeof request.user === 'object' &&
                    'id' in request.user &&
                    typeof request.user.id === 'string'
                    ? request.user.id
                    : 'anonymous',
            ip: request.ip,
            userAgent: request.headers['user-agent'],
        };

        if (status >= 500) {
            this.logger.error(
                `Server Error: ${errorMessage}`,
                errorStack,
                JSON.stringify(logContext),
            );
        } else if (status >= 400) {
            this.logger.warn(
                `Client Error: ${errorMessage}`,
                JSON.stringify(logContext),
            );
        }
    }
}
