import { RbacService } from '@/rbac/services/rbac.service';
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  REQUIRE_RESOURCE_KEY,
  REQUIRE_SUBSCRIPTION_KEY,
} from '../decorators/require-subscription.decorator';
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

    const role = await this.rbacService.getRoleWithPermissions(user.roleId);

    if (!role?.proFeatureId) {
      return true;
    }

    const subscription = await this.subscriptionService.getActiveSubscription(user.tenantId);

    if (!subscription) {
      throw new ForbiddenException('Subscription required. Please upgrade to access this feature.');
    }

    const requiredResource = this.reflector.getAllAndOverride<string>(REQUIRE_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredResource) {
      const hasAccess = await this.subscriptionService.checkResourceAccess(
        user.tenantId,
        requiredResource,
      );

      if (!hasAccess) {
        throw new ForbiddenException(
          `Resource "${requiredResource}" is not included in your current plan. Please upgrade to access this feature.`,
        );
      }
    }

    return true;
  }
}
