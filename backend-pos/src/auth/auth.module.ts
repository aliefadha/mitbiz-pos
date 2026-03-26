import { Module } from '@nestjs/common';
import { AuthModule as NestjsBetterAuthModule } from '@thallesp/nestjs-better-auth';
import { AuthOpenApiController } from './controllers/auth-openapi.controller';

@Module({
  imports: [NestjsBetterAuthModule],
  controllers: [AuthOpenApiController],
})
export class AuthApiModule {}
