import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {AuthModule} from "@thallesp/nestjs-better-auth";
import {auth} from "./lib/auth";
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { ResponseEnvelopeInterceptor } from './common/interceptors/response-envelope.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    AuthModule.forRoot({ auth, disableGlobalAuthGuard:true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 60000,   // 1 minute
        limit: 100,   // 100 requests per minute (POS-friendly)
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
