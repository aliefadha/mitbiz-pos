import { Module } from '@nestjs/common';
import { MidtransController } from './midtrans.controller';
import { MidtransService } from './midtrans.service';

@Module({
  controllers: [MidtransController],
  providers: [MidtransService],
  exports: [MidtransService],
})
export class MidtransModule {}
