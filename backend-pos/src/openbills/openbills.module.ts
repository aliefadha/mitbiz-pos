import { Module } from '@nestjs/common';
import { OpenBillsController } from './openbills.controller';
import { OpenBillsService } from './openbills.service';

@Module({
  controllers: [OpenBillsController],
  providers: [OpenBillsService],
  exports: [OpenBillsService],
})
export class OpenBillsModule {}
