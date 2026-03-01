import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { AppService } from './app.service';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get Hello World message' })
  @ApiResponse({ status: 200, description: 'Returns hello world message' })
  @ApiBearerAuth('JWT-auth')
  getHello(): string {
    return this.appService.getHello();
  }
}
