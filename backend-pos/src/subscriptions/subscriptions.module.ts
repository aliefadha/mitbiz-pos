import { RbacModule } from '@/rbac/rbac.module';
import { Module } from '@nestjs/common';
import { ProFeaturesController } from './pro-features.controller';
import {
  SubscriptionPlansController,
  TenantSubscriptionsController,
} from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  controllers: [SubscriptionPlansController, TenantSubscriptionsController, ProFeaturesController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
  imports: [RbacModule],
})
export class SubscriptionsModule {}
