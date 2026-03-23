import { DB_CONNECTION } from '@/db/db.module';
import { subscriptionHistories, subscriptionPlans, subscriptions, tenants } from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import { Snap } from 'midtrans-client';

@Injectable()
export class MidtransService {
  private snap: Snap;
  private isProduction: boolean;

  constructor(
    private configService: ConfigService,
    @Inject(DB_CONNECTION) private db: DrizzleDB,
  ) {
    const serverKey = this.configService.get<string>('MIDTRANS_SERVER_KEY');
    const clientKey = this.configService.get<string>('MIDTRANS_CLIENT_KEY');
    const isProductionStr = this.configService.get<string>('MIDTRANS_IS_PRODUCTION');
    this.isProduction = isProductionStr === 'true';

    if (!serverKey) {
      throw new Error('MIDTRANS_SERVER_KEY is not configured');
    }

    this.snap = new Snap({
      clientKey: clientKey ?? '',
      serverKey: serverKey,
      isProduction: this.isProduction,
    });
  }

  async createSnapTransaction(planId: string, tenantId: string, userId: string) {
    const plan = await this.db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.id, planId),
    });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    if (!plan.isActive) {
      throw new BadRequestException('Cannot subscribe to an inactive plan');
    }

    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      with: {
        user: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const existingSubscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.tenantId, tenantId),
    });

    if (existingSubscription && existingSubscription.status === 'active') {
      throw new BadRequestException('Tenant already has an active subscription');
    }

    let subscription: typeof subscriptions.$inferSelect | undefined;
    if (
      existingSubscription &&
      ['pending', 'expired', 'cancelled'].includes(existingSubscription.status)
    ) {
      const [updated] = await this.db
        .update(subscriptions)
        .set({
          planId: plan.id,
          status: 'pending',
          startedAt: new Date(),
          expiresAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id))
        .returning();
      subscription = updated;
    } else {
      const [newSubscription] = await this.db
        .insert(subscriptions)
        .values({
          tenantId: tenantId,
          planId: plan.id,
          status: 'pending',
          startedAt: new Date(),
          expiresAt: new Date(),
        })
        .returning();
      subscription = newSubscription;
    }

    const shortUuid = subscription.id.split('-')[0];
    const orderId = `SUB-${tenant.slug}-${shortUuid}`;

    const grossAmount = parseFloat(plan.price);

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      customer_details: {
        first_name: tenant.nama,
        email: tenant.user?.email || 'unknown@placeholder.com',
        billing_address: {
          address: tenant.alamat || '',
        },
      },
      item_details: [
        {
          id: plan.id,
          name: plan.name,
          price: grossAmount,
          quantity: 1,
        },
      ],
      callbacks: {
        finish: `${this.configService.get<string>('MIDTRANS_FINISH_URL') || 'https://pos.mitbiz.id'}/subscription?payment=success`,
      },
      notificationUrl: `${this.configService.get<string>('MIDTRANS_NOTIFICATION_URL') || 'https://api-pos.mitbiz.id/api/payments/notification'}`,
    };

    const transaction = await this.snap.createTransaction(parameter);

    await this.db
      .update(subscriptions)
      .set({
        midtransOrderId: orderId,
      })
      .where(eq(subscriptions.id, subscription.id));

    return {
      snapToken: transaction.token,
      orderId: orderId,
      redirectUrl: transaction.redirect_url,
    };
  }

  async handleNotification(notification: any) {
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;

    const subscription = await this.db.query.subscriptions.findFirst({
      where: eq(subscriptions.midtransOrderId, orderId),
      with: {
        plan: true,
        tenant: true,
      },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (transactionStatus === 'settlement' || transactionStatus === 'capture') {
      const startedAt = new Date();
      const billingCycleDays = this.getBillingCycleDays(subscription.plan?.billingCycle);
      const expiresAt = new Date(startedAt.getTime() + billingCycleDays * 24 * 60 * 60 * 1000);

      await this.db
        .update(subscriptions)
        .set({
          status: 'active',
          startedAt,
          expiresAt,
        })
        .where(eq(subscriptions.id, subscription.id));

      await this.db.insert(subscriptionHistories).values({
        tenantId: subscription.tenant?.id,
        subscriptionId: subscription.id,
        planId: subscription.planId,
        action: 'subscribed',
        amountPaid: subscription.plan?.price,
        periodStart: startedAt,
        periodEnd: expiresAt,
        performedBy: null,
      });

      return { success: true, message: 'Subscription activated' };
    }
    if (transactionStatus === 'expire') {
      await this.db
        .update(subscriptions)
        .set({
          status: 'expired',
        })
        .where(eq(subscriptions.id, subscription.id));

      return { success: true, message: 'Subscription expired' };
    }
    if (transactionStatus === 'cancel' || transactionStatus === 'deny') {
      await this.db
        .update(subscriptions)
        .set({
          status: 'cancelled',
        })
        .where(eq(subscriptions.id, subscription.id));

      return { success: true, message: 'Subscription cancelled' };
    }

    return { success: true, message: 'Notification processed' };
  }

  private getBillingCycleDays(billingCycle: string | undefined): number {
    switch (billingCycle) {
      case 'monthly':
        return 30;
      case 'quarterly':
        return 90;
      case 'yearly':
        return 365;
      default:
        return 30;
    }
  }
}
