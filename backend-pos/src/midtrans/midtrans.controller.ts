import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@thallesp/nestjs-better-auth';
import {
  CreateSnapTransactionDto,
  CreateSnapTransactionSchema,
} from './dto/create-transaction.dto';
import { MidtransService } from './midtrans.service';

@Controller('payments')
export class MidtransController {
  constructor(private readonly midtransService: MidtransService) {}

  @Post('snap/token')
  @UseGuards(AuthGuard)
  async createSnapToken(
    @Body(new ZodValidationPipe(CreateSnapTransactionSchema)) dto: CreateSnapTransactionDto,
    @Req() req: any,
  ) {
    const user = req.user;
    const tenantId = user.tenantId;

    if (!tenantId) {
      throw new Error('Tenant ID not found in session');
    }

    return this.midtransService.createSnapTransaction(dto.planId, tenantId, user.id);
  }

  @Post('notification')
  // Disable auth guard for webhook endpoint - Midtrans doesn't send auth headers
  async handleNotification(@Body() notification: any) {
    return this.midtransService.handleNotification(notification);
  }
}
