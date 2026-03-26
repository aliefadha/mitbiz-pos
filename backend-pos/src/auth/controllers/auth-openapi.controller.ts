import { Controller, Get } from '@nestjs/common';
import { AuthService, Public } from '@thallesp/nestjs-better-auth';

@Controller('auth-schema')
export class AuthOpenApiController {
  constructor(private readonly authService: AuthService) {}

  @Get('openapi-schema')
  @Public()
  async getOpenApiSchema() {
    return (this.authService.api as any).generateOpenAPISchema();
  }
}
