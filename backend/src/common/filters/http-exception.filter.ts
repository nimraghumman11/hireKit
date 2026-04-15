import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as Record<string, unknown>)?.message ?? 'Internal server error';

    const code =
      (exceptionResponse as Record<string, unknown>)?.error ?? 'INTERNAL_ERROR';

    response.status(status).json({
      data: null,
      error: {
        code,
        message: Array.isArray(message) ? message.join(', ') : message,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: randomUUID(),
        path: request.url,
      },
    });
  }
}
