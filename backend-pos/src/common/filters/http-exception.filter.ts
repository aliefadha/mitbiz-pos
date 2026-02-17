import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

export interface ErrorEnvelope {
  success: boolean;
  data: null;
  message: string;
  errors?: unknown[];
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse<Response>();

    const { method, url, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const now = Date.now();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    // Handle Zod validation exceptions from nestjs-zod
    if (exception instanceof ZodValidationException) {
      status = HttpStatus.BAD_REQUEST;
      const zodError = exception.getZodError() as {
        errors: Array<{
          path: (string | number)[];
          message: string;
          code: string;
        }>;
      };
      const errorMessages = zodError.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`,
      );
      message = errorMessages.join(', ');
    } else if (exception instanceof BadRequestException) {
      // Handle BadRequestException (often from validation pipes)
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      let errors: unknown[] | undefined;
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = (responseObj.message as string[]).join(', ');
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
        errors = responseObj.errors as unknown[] | undefined;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }

      const errorResponse: ErrorEnvelope = {
        success: false,
        data: null,
        message,
      };
      if (errors) {
        errorResponse.errors = errors;
      }
      response.status(status).json(errorResponse);
      return;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        if (Array.isArray(responseObj.message)) {
          message = (responseObj.message as string[])[0];
        } else if (typeof responseObj.message === 'string') {
          message = responseObj.message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      // Log full error details including cause if present (for debugging)
      const errorWithCause = exception as Error & { cause?: unknown };
      if (errorWithCause.cause) {
        console.error('Error cause:', errorWithCause.cause);
      }
      console.error('Full exception:', exception);
    }

    const errorResponse: ErrorEnvelope = {
      success: false,
      data: null,
      message,
    };

    response.status(status).json(errorResponse);

    const responseTime = Date.now() - now;
    this.logger.error(
      `${method} ${url} ${status} - ${userAgent} - ${ip || ''} - ${responseTime}ms - ${message}`,
    );
  }
}
