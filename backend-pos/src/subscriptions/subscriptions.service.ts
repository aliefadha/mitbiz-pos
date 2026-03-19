import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import {
  planProFeatures,
  planResources,
  proFeatures,
  resources,
  subscriptionHistories,
  subscriptionPlans,
  subscriptions,
  tenants,
} from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { RbacService } from '@/rbac/services/rbac.service';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, asc, desc, eq, ne, sql } from 'drizzle-orm';
import {
  BillingCycle,
  CreateSubscriptionDto,
  CreateSubscriptionPlanDto,
  RenewSubscriptionDto,
  SubscriptionHistoryQueryDto,
  SubscriptionPlanQueryDto,
  UpdateSubscriptionPlanDto,
} from './dto';

const BILLING_CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
    private readonly rbacService: RbacService,
  ) {}

  private async getTenantBySlug(slug: string) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return tenant;
  }

  async findAllPlans(query: SubscriptionPlanQueryDto) {
    const { page = 1, limit = 10, isActive, billingCycle } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(subscriptionPlans.isActive, isActive));
    }

    if (billingCycle) {
      conditions.push(eq(subscriptionPlans.billingCycle, billingCycle));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.subscriptionPlans.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [asc(subscriptionPlans.createdAt)],
        with: {
          planProFeatures: {
            with: {
              proFeature: true,
            },
          },
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(subscriptionPlans).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPlanById(id: string) {
    const plan = await this.db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, id),
      with: {
        planProFeatures: {
          with: {
            proFeature: true,
          },
        },
      },
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async findAllProFeatures() {
    return this.db.query.proFeatures.findMany({
      where: eq(proFeatures.isActive, true),
      orderBy: [asc(proFeatures.name)],
    });
  }

  async createPlan(data: CreateSubscriptionPlanDto) {
    const existing = await this.db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, data.name),
    });

    if (existing) {
      throw new ConflictException('Subscription plan with this name already exists');
    }

    const { proFeatureIds, ...planData } = data;

    const [plan] = await this.db
      .insert(subscriptionPlans)
      .values({
        ...planData,
      })
      .returning();

    if (proFeatureIds && proFeatureIds.length > 0) {
      for (const proFeatureId of proFeatureIds) {
        await this.db.insert(planProFeatures).values({
          planId: plan.id,
          proFeatureId,
        });
      }
    }

    return this.findPlanById(plan.id);
  }

  async updatePlan(id: string, data: UpdateSubscriptionPlanDto) {
    await this.findPlanById(id);

    if (data.name) {
      const existing = await this.db.query.subscriptionPlans.findFirst({
        where: and(eq(subscriptionPlans.name, data.name), ne(subscriptionPlans.id, id)),
      });

      if (existing) {
        throw new ConflictException('Subscription plan with this name already exists');
      }
    }

    const [plan] = await this.db
      .update(subscriptionPlans)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptionPlans.id, id))
      .returning();

    return plan;
  }

  async deletePlan(id: string) {
    await this.findPlanById(id);

    await this.db.delete(subscriptionPlans).where(eq(subscriptionPlans.id, id));

    return { message: 'Plan deleted successfully' };
  }

  async getTenantSubscription(slug: string, user: CurrentUserWithRole) {
    const tenant = await this.getTenantBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenant.id),
      with: {
        plan: true,
      },
    });

    return {
      tenant: {
        id: tenant.id,
        nama: tenant.nama,
        slug: tenant.slug,
      },
      subscription,
    };
  }

  async createSubscription(slug: string, data: CreateSubscriptionDto, user: CurrentUserWithRole) {
    const tenant = await this.getTenantBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const plan = await this.findPlanById(data.planId);

    if (!plan.isActive) {
      throw new ConflictException('Cannot subscribe to an inactive plan');
    }

    const existingSubscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenant.id),
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      throw new ConflictException('Tenant already has an active subscription');
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + BILLING_CYCLE_DAYS[plan.billingCycle] * 24 * 60 * 60 * 1000,
    );

    // TODO: Add payment integration here
    // const payment = await this.processPayment(data, plan);
    // if (!payment.success) {
    //   throw new BadRequestException('Payment failed');
    // }

    const [subscription] = await this.db
      .insert(subscriptions)
      .values({
        tenantId: tenant.id,
        planId: data.planId,
        status: 'active',
        startedAt,
        expiresAt,
      })
      .returning();

    await this.db.insert(subscriptionHistories).values({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      planId: data.planId,
      action: 'subscribed',
      amountPaid: plan.price,
      periodStart: startedAt,
      periodEnd: expiresAt,
      performedBy: user.id,
    });

    return {
      tenant: {
        id: tenant.id,
        nama: tenant.nama,
        slug: tenant.slug,
      },
      subscription: {
        ...subscription,
        plan,
      },
    };
  }

  async renewSubscription(slug: string, data: RenewSubscriptionDto, user: CurrentUserWithRole) {
    const tenant = await this.getTenantBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const subscription = await this.db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.tenantId, tenant.id), ne(subscriptions.status, 'cancelled')),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found or already cancelled');
    }

    const billingCycle: BillingCycle =
      data.billingCycle || subscription.plan?.billingCycle || 'monthly';
    const newExpiresAt = new Date(
      new Date().getTime() + BILLING_CYCLE_DAYS[billingCycle] * 24 * 60 * 60 * 1000,
    );

    // TODO: Add payment integration here
    // const payment = await this.processPayment(data, subscription.plan);
    // if (!payment.success) {
    //   throw new BadRequestException('Payment failed');
    // }

    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set({
        status: 'active',
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    const previousExpiresAt = subscription.expiresAt;

    await this.db.insert(subscriptionHistories).values({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      action: 'renewed',
      amountPaid: subscription.plan?.price,
      periodStart: previousExpiresAt,
      periodEnd: newExpiresAt,
      performedBy: user.id,
    });

    return {
      tenant: {
        id: tenant.id,
        nama: tenant.nama,
        slug: tenant.slug,
      },
      subscription: {
        ...updatedSubscription,
        plan: subscription.plan,
      },
    };
  }

  async cancelSubscription(slug: string, user: CurrentUserWithRole) {
    const tenant = await this.getTenantBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenant.id),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('No subscription found for this tenant');
    }

    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscription.id))
      .returning();

    await this.db.insert(subscriptionHistories).values({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      action: 'cancelled',
      periodStart: subscription.startedAt,
      periodEnd: subscription.expiresAt,
      performedBy: user.id,
    });

    return {
      tenant: {
        id: tenant.id,
        nama: tenant.nama,
        slug: tenant.slug,
      },
      subscription: {
        ...updatedSubscription,
        plan: subscription.plan,
      },
    };
  }

  async cancelSubscriptionById(subscriptionId: string, userId?: string) {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.id, subscriptionId),
      with: {
        tenant: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    await this.db.insert(subscriptionHistories).values({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      action: 'cancelled',
      periodStart: subscription.startedAt,
      periodEnd: subscription.expiresAt,
      performedBy: userId,
    });

    return {
      tenant: {
        id: subscription.tenant.id,
        nama: subscription.tenant.nama,
        slug: subscription.tenant.slug,
      },
      subscription: {
        ...updatedSubscription,
        plan: subscription.plan,
      },
    };
  }

  async renewSubscriptionById(subscriptionId: string, userId?: string) {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.id, subscriptionId), ne(subscriptions.status, 'cancelled')),
      with: {
        tenant: true,
        plan: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found or already cancelled');
    }

    const billingCycle: BillingCycle = subscription.plan?.billingCycle || 'monthly';
    const newExpiresAt = new Date(
      new Date().getTime() + BILLING_CYCLE_DAYS[billingCycle] * 24 * 60 * 60 * 1000,
    );

    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set({
        status: 'active',
        expiresAt: newExpiresAt,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning();

    const previousExpiresAt = subscription.expiresAt;

    await this.db.insert(subscriptionHistories).values({
      tenantId: subscription.tenantId,
      subscriptionId: subscription.id,
      planId: subscription.planId,
      action: 'renewed',
      amountPaid: subscription.plan?.price,
      periodStart: previousExpiresAt,
      periodEnd: newExpiresAt,
      performedBy: userId,
    });

    return {
      tenant: {
        id: subscription.tenant.id,
        nama: subscription.tenant.nama,
        slug: subscription.tenant.slug,
      },
      subscription: {
        ...updatedSubscription,
        plan: subscription.plan,
      },
    };
  }

  async getActiveSubscription(tenantId: string) {
    const subscription = await this.db.query.subscriptions.findFirst({
      where: and(eq(subscriptions.tenantId, tenantId), eq(subscriptions.status, 'active')),
      with: {
        plan: true,
      },
    });

    if (!subscription) {
      return null;
    }

    if (new Date(subscription.expiresAt) < new Date()) {
      return null;
    }

    return subscription;
  }

  async suspendExpired(tenantId: string) {
    const expiredSubscriptions = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.tenantId, tenantId),
          eq(subscriptions.status, 'active'),
          sql`${subscriptions.expiresAt} < now()`,
        ),
      );

    for (const subscription of expiredSubscriptions) {
      await this.db
        .update(subscriptions)
        .set({
          status: 'suspended',
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id));
    }
  }

  async checkAccess(tenantId: string, roleId: string): Promise<boolean> {
    const role = await this.rbacService.getRoleWithPermissions(roleId);

    if (!role?.proFeatureId) {
      return true;
    }

    const subscription = await this.getActiveSubscription(tenantId);
    return subscription !== null;
  }

  async getPlanResources(planId: string) {
    const planResourceLinks = await this.db.query.planResources.findMany({
      where: eq(planResources.planId, planId),
      with: {
        resource: true,
      },
    });

    return planResourceLinks.filter((pr) => pr.isIncluded).map((pr) => pr.resource);
  }

  async getAllResourcesWithPlanStatus(planId: string) {
    const allResources = await this.db.query.resources.findMany({
      where: eq(resources.isActive, true),
    });

    const planResourcesLinks = await this.db.query.planResources.findMany({
      where: eq(planResources.planId, planId),
    });

    const planResourcesMap = new Map(
      planResourcesLinks.map((pr) => [pr.resourceId, pr.isIncluded]),
    );

    return allResources.map((resource) => ({
      ...resource,
      isIncluded: planResourcesMap.get(resource.id) ?? false,
    }));
  }

  async getIncludedResources(planId: string) {
    const plan = await this.findPlanById(planId);

    if (plan.name === 'Free') {
      return [];
    }

    const includedResources = await this.db.query.planResources.findMany({
      where: and(eq(planResources.planId, planId), eq(planResources.isIncluded, true)),
      with: {
        resource: true,
      },
    });

    return includedResources.map((pr) => pr.resource);
  }

  async checkResourceAccess(tenantId: string, resourceName: string): Promise<boolean> {
    const activeSubscription = await this.getActiveSubscription(tenantId);

    if (!activeSubscription || !activeSubscription.planId) {
      return false;
    }

    const resource = await this.db.query.resources.findFirst({
      where: eq(resources.name, resourceName),
    });

    if (!resource) {
      return false;
    }

    const planResource = await this.db.query.planResources.findFirst({
      where: and(
        eq(planResources.planId, activeSubscription.planId),
        eq(planResources.resourceId, resource.id),
      ),
    });

    return planResource?.isIncluded ?? false;
  }

  async addResourceToPlan(planId: string, resourceId: string) {
    const existing = await this.db.query.planResources.findFirst({
      where: and(eq(planResources.planId, planId), eq(planResources.resourceId, resourceId)),
    });

    if (existing) {
      await this.db
        .update(planResources)
        .set({ isIncluded: true, updatedAt: new Date() })
        .where(eq(planResources.id, existing.id));
      return existing;
    }

    const [planResource] = await this.db
      .insert(planResources)
      .values({
        planId,
        resourceId,
        isIncluded: true,
      })
      .returning();

    return planResource;
  }

  async removeResourceFromPlan(planId: string, resourceId: string) {
    const existing = await this.db.query.planResources.findFirst({
      where: and(eq(planResources.planId, planId), eq(planResources.resourceId, resourceId)),
    });

    if (!existing) {
      return null;
    }

    const [planResource] = await this.db
      .update(planResources)
      .set({ isIncluded: false, updatedAt: new Date() })
      .where(eq(planResources.id, existing.id))
      .returning();

    return planResource;
  }

  async addAllResourcesToPlan(planId: string) {
    const allResources = await this.db.query.resources.findMany({
      where: eq(resources.isActive, true),
    });

    for (const resource of allResources) {
      await this.addResourceToPlan(planId, resource.id);
    }

    return this.getAllResourcesWithPlanStatus(planId);
  }

  async updatePlanResourcesBulk(
    planId: string,
    resourcesData: Array<{ resourceId: string; isIncluded: boolean }>,
  ) {
    await this.findPlanById(planId);

    for (const { resourceId, isIncluded } of resourcesData) {
      if (isIncluded) {
        await this.addResourceToPlan(planId, resourceId);
      } else {
        await this.removeResourceFromPlan(planId, resourceId);
      }
    }

    return this.getAllResourcesWithPlanStatus(planId);
  }

  async getPlanProFeatures(planId: string) {
    const plan = await this.findPlanById(planId);

    return plan.planProFeatures.map((ppf) => ppf.proFeature);
  }

  async getAllProFeaturesWithPlanStatus(planId: string) {
    const allProFeatures = await this.db.query.proFeatures.findMany({
      where: eq(proFeatures.isActive, true),
    });

    const planProFeaturesLinks = await this.db.query.planProFeatures.findMany({
      where: eq(planProFeatures.planId, planId),
    });

    const planProFeaturesMap = new Set(planProFeaturesLinks.map((ppf) => ppf.proFeatureId));

    return allProFeatures.map((feature) => ({
      ...feature,
      isIncluded: planProFeaturesMap.has(feature.id),
    }));
  }

  async addProFeatureToPlan(planId: string, proFeatureId: string) {
    await this.findPlanById(planId);

    const existingProFeature = await this.db.query.proFeatures.findFirst({
      where: eq(proFeatures.id, proFeatureId),
    });

    if (!existingProFeature) {
      throw new NotFoundException('Pro feature not found');
    }

    const existing = await this.db.query.planProFeatures.findFirst({
      where: and(
        eq(planProFeatures.planId, planId),
        eq(planProFeatures.proFeatureId, proFeatureId),
      ),
    });

    if (existing) {
      return existing;
    }

    const [planProFeature] = await this.db
      .insert(planProFeatures)
      .values({
        planId,
        proFeatureId,
      })
      .returning();

    return planProFeature;
  }

  async removeProFeatureFromPlan(planId: string, proFeatureId: string) {
    await this.findPlanById(planId);

    const existing = await this.db.query.planProFeatures.findFirst({
      where: and(
        eq(planProFeatures.planId, planId),
        eq(planProFeatures.proFeatureId, proFeatureId),
      ),
    });

    if (!existing) {
      return null;
    }

    await this.db.delete(planProFeatures).where(eq(planProFeatures.id, existing.id));

    return { message: 'Pro feature removed from plan' };
  }

  async addAllProFeaturesToPlan(planId: string) {
    await this.findPlanById(planId);

    const allProFeatures = await this.db.query.proFeatures.findMany({
      where: eq(proFeatures.isActive, true),
    });

    for (const feature of allProFeatures) {
      await this.addProFeatureToPlan(planId, feature.id);
    }

    return this.getAllProFeaturesWithPlanStatus(planId);
  }

  async updatePlanProFeaturesBulk(
    planId: string,
    proFeaturesData: Array<{ proFeatureId: string; isIncluded: boolean }>,
  ) {
    await this.findPlanById(planId);

    for (const { proFeatureId, isIncluded } of proFeaturesData) {
      if (isIncluded) {
        await this.addProFeatureToPlan(planId, proFeatureId);
      } else {
        await this.removeProFeatureFromPlan(planId, proFeatureId);
      }
    }

    return this.getAllProFeaturesWithPlanStatus(planId);
  }

  async getSubscriptionsByPlanId(planId: string) {
    await this.findPlanById(planId);

    const subscriptionsWithTenants = await this.db.query.subscriptions.findMany({
      where: eq(subscriptions.planId, planId),
      with: {
        tenant: true,
      },
      orderBy: [asc(subscriptions.createdAt)],
    });

    return subscriptionsWithTenants.map((sub) => ({
      subscription: {
        id: sub.id,
        status: sub.status,
        startedAt: sub.startedAt,
        expiresAt: sub.expiresAt,
        createdAt: sub.createdAt,
        updatedAt: sub.updatedAt,
      },
      tenant: {
        id: sub.tenant.id,
        nama: sub.tenant.nama,
        slug: sub.tenant.slug,
      },
    }));
  }

  async getTenantsWithActiveSubscriptions() {
    const activeSubscriptions = await this.db.query.subscriptions.findMany({
      where: eq(subscriptions.status, 'active'),
      with: {
        tenant: true,
        plan: true,
      },
    });

    const now = new Date();
    const validSubscriptions = activeSubscriptions.filter((sub) => new Date(sub.expiresAt) > now);

    return validSubscriptions.map((sub) => ({
      subscription: {
        id: sub.id,
        status: sub.status,
        startedAt: sub.startedAt,
        expiresAt: sub.expiresAt,
      },
      tenant: {
        id: sub.tenant.id,
        nama: sub.tenant.nama,
        slug: sub.tenant.slug,
      },
      plan: {
        id: sub.plan?.id,
        name: sub.plan?.name,
      },
    }));
  }

  async getSubscriptionHistory(
    slug: string,
    query: SubscriptionHistoryQueryDto,
    user: CurrentUserWithRole,
  ) {
    const tenant = await this.getTenantBySlug(slug);

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const { page = 1, limit = 10, action } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [eq(subscriptionHistories.tenantId, tenant.id)];

    if (action) {
      conditions.push(eq(subscriptionHistories.action, action));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.subscriptionHistories.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [asc(subscriptionHistories.createdAt)],
        with: {
          plan: true,
          subscription: true,
        },
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptionHistories)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPlanSubscriptionHistory(planId: string, query: SubscriptionHistoryQueryDto) {
    await this.findPlanById(planId);

    const { page = 1, limit = 10, action, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [eq(subscriptionHistories.planId, planId)];

    if (action) {
      conditions.push(eq(subscriptionHistories.action, action));
    }

    if (tenantId) {
      conditions.push(eq(subscriptionHistories.tenantId, tenantId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.subscriptionHistories.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(subscriptionHistories.createdAt)],
        with: {
          tenant: true,
          plan: true,
        },
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptionHistories)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data.map((h) => ({
        id: h.id,
        tenantId: h.tenantId,
        tenantName: h.tenant.nama,
        tenantSlug: h.tenant.slug,
        subscriptionId: h.subscriptionId,
        planId: h.planId,
        planName: h.plan?.name || 'Unknown',
        action: h.action,
        amountPaid: h.amountPaid,
        invoiceRef: h.invoiceRef,
        periodStart: h.periodStart,
        periodEnd: h.periodEnd,
        performedBy: h.performedBy,
        createdAt: h.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllSubscriptionHistory(query: SubscriptionHistoryQueryDto) {
    const { page = 1, limit = 10, action, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (action) {
      conditions.push(eq(subscriptionHistories.action, action));
    }

    if (tenantId) {
      conditions.push(eq(subscriptionHistories.tenantId, tenantId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.subscriptionHistories.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(subscriptionHistories.createdAt)],
        with: {
          tenant: true,
          plan: true,
        },
      }),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(subscriptionHistories)
        .where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data.map((h) => ({
        id: h.id,
        tenantId: h.tenantId,
        tenantName: h.tenant.nama,
        tenantSlug: h.tenant.slug,
        subscriptionId: h.subscriptionId,
        planId: h.planId,
        planName: h.plan?.name || 'Unknown',
        action: h.action,
        amountPaid: h.amountPaid,
        invoiceRef: h.invoiceRef,
        periodStart: h.periodStart,
        periodEnd: h.periodEnd,
        performedBy: h.performedBy,
        createdAt: h.createdAt,
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
