import { OutletsModule } from '@/outlets/outlets.module';
import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantsService],
  exports: [TenantsService],
  imports: [OutletsModule],
})
export class TenantsModule {}
