import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ResponseEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ErrorEnvelope {
  success: boolean;
  data: null;
  message: string;
}

@Injectable()
export class ResponseEnvelopeInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T> | T> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T> | T> {
    const request = context.switchToHttp().getRequest();

    if (request.path?.startsWith('/api/auth')) {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map((data) => ({
        success: true,
        data,
        message: 'Success',
      })),
    );
  }
}
