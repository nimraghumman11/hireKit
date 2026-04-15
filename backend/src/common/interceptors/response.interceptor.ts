import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { randomUUID } from 'crypto';

export interface ApiResponse<T> {
  data: T;
  error: null;
  meta: {
    timestamp: string;
    requestId: string;
  };
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const res = context.switchToHttp().getResponse<{ getHeader?: (h: string) => string; writableEnded?: boolean }>();
    const contentType = res.getHeader?.('Content-Type') ?? '';
    // SSE endpoints manage their own response — skip envelope wrapping
    if (String(contentType).includes('text/event-stream') || res.writableEnded) {
      return next.handle() as Observable<ApiResponse<T>>;
    }
    return next.handle().pipe(
      map((data) => ({
        data,
        error: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: randomUUID(),
        },
      })),
    );
  }
}
