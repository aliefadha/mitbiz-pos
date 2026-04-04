import { RbacService } from '@/rbac/services/rbac.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_SUBSCRIPTION_KEY } from '../decorators/require-subscription.decorator';
import { SubscriptionsService } from '../subscriptions.service';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService,
    private subscriptionService: SubscriptionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.roleId) {
      throw new ForbiddenException('Role not assigned');
    }

    if (!user?.tenantId) {
      throw new ForbiddenException('Tenant not found');
    }

    const requiresSubscription = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_SUBSCRIPTION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiresSubscription) {
      return true;
    }

    const subscription = await this.subscriptionService.getActiveSubscription(user.tenantId);

    if (!subscription) {
      throw new ForbiddenException('Subscription required. Please upgrade to access this feature.');
    }

    return true;
  }
}
