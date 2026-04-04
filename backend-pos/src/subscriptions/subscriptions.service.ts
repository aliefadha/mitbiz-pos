import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { subscriptionHistories, subscriptionPlans, subscriptions, tenants } from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
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
  semi_annual: 180,
  yearly: 365,
};

@Injectable()
export class SubscriptionsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  private async getTenantBySlug(slug: string) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
    return tenant;
  }

  private getPriceForBillingCycle(
    billingCycles: Array<{ cycle: string; price: string }>,
    billingCycle: BillingCycle,
  ): string {
    const cycle = billingCycles.find((bc) => bc.cycle === billingCycle);
    if (!cycle) {
      throw new NotFoundException(`Billing cycle '${billingCycle}' not found for this plan`);
    }
    return cycle.price;
  }

  async findAllPlans(query: SubscriptionPlanQueryDto) {
    const { page = 1, limit = 10, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(subscriptionPlans.isActive, isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.subscriptionPlans.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [asc(subscriptionPlans.createdAt)],
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
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }

  async createPlan(data: CreateSubscriptionPlanDto) {
    const existing = await this.db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, data.name),
    });

    if (existing) {
      throw new ConflictException('Subscription plan with this name already exists');
    }

    const [plan] = await this.db
      .insert(subscriptionPlans)
      .values({
        name: data.name,
        isActive: data.isActive,
        billingCycles: data.billingCycles.map((bc) => ({
          cycle: bc.billingCycle,
          price: bc.price,
        })),
      })
      .returning();

    return plan;
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

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name) {
      updateData.name = data.name;
    }
    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }
    if (data.billingCycles) {
      updateData.billingCycles = data.billingCycles.map((bc) => ({
        cycle: bc.billingCycle,
        price: bc.price,
      }));
    }

    const [plan] = await this.db
      .update(subscriptionPlans)
      .set(updateData)
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

    const price = this.getPriceForBillingCycle(plan.billingCycles, data.billingCycle);

    const existingSubscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenant.id),
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      throw new ConflictException('Tenant already has an active subscription');
    }

    const startedAt = new Date();
    const expiresAt = new Date(
      startedAt.getTime() + BILLING_CYCLE_DAYS[data.billingCycle] * 24 * 60 * 60 * 1000,
    );

    const [subscription] = await this.db
      .insert(subscriptions)
      .values({
        tenantId: tenant.id,
        planId: plan.id,
        billingCycle: data.billingCycle,
        status: 'active',
        startedAt,
        expiresAt,
      })
      .returning();

    await this.db.insert(subscriptionHistories).values({
      tenantId: tenant.id,
      subscriptionId: subscription.id,
      planId: plan.id,
      action: 'subscribed',
      amountPaid: price,
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

    const price = this.getPriceForBillingCycle(subscription.plan.billingCycles, data.billingCycle);

    const newExpiresAt = new Date(
      new Date().getTime() + BILLING_CYCLE_DAYS[data.billingCycle] * 24 * 60 * 60 * 1000,
    );

    const [updatedSubscription] = await this.db
      .update(subscriptions)
      .set({
        status: 'active',
        billingCycle: data.billingCycle,
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
      amountPaid: price,
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

    const price = this.getPriceForBillingCycle(
      subscription.plan.billingCycles,
      subscription.billingCycle,
    );

    const newExpiresAt = new Date(
      new Date().getTime() + BILLING_CYCLE_DAYS[subscription.billingCycle] * 24 * 60 * 60 * 1000,
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
      amountPaid: price,
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
        id: sub.plan.id,
        name: sub.plan.name,
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
          tenant: true,
          subscription: true,
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
        tenantName: h.tenant?.nama || 'Unknown',
        tenantSlug: h.tenant?.slug || 'Unknown',
        subscriptionId: h.subscriptionId,
        planId: h.plan?.id,
        planName: h.plan?.name || 'Unknown',
        action: h.action,
        billingCycle: h.subscription?.billingCycle,
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
      data: data.map((h) => ({
        id: h.id,
        tenantId: h.tenantId,
        tenantName: h.tenant.nama,
        tenantSlug: h.tenant.slug,
        subscriptionId: h.subscriptionId,
        planId: h.plan?.id,
        planName: h.plan?.name || 'Unknown',
        action: h.action,
        billingCycle: h.subscription?.billingCycle,
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
      data: data.map((h) => ({
        id: h.id,
        tenantId: h.tenantId,
        tenantName: h.tenant.nama,
        tenantSlug: h.tenant.slug,
        subscriptionId: h.subscriptionId,
        planId: h.plan?.id,
        planName: h.plan?.name || 'Unknown',
        action: h.action,
        billingCycle: h.subscription?.billingCycle,
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
