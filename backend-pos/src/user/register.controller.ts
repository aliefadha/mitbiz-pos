import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Public } from '@/rbac';
import { Body, Controller, Post, UsePipes } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RegisterCompleteSchema, RegisterService } from './register.service';
import type { RegisterCompleteInput } from './register.service';

@ApiTags('register')
@Controller('register')
export class RegisterController {
  constructor(private readonly registerService: RegisterService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Complete registration flow (create account, tenant, and outlet)' })
  @UsePipes(new ZodValidationPipe(RegisterCompleteSchema))
  async registerComplete(@Body() data: RegisterCompleteInput) {
    return this.registerService.registerComplete(data);
  }
}
