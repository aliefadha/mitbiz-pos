import { RbacModule } from '@/rbac/rbac.module';
import { Module } from '@nestjs/common';
import {
  SubscriptionPlansController,
  TenantSubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionPlansController, TenantSubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
  imports: [RbacModule],
})
export class SubscriptionsModule {}
