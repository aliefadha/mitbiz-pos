import { relations, sql } from 'drizzle-orm';
import { decimal, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subscriptionPlans } from './subscription-plan-schema';
import { subscriptions } from './subscription-schema';
import { tenants } from './tenant-schema';

export const subscriptionActionEnum = pgEnum('subscription_action', [
  'subscribed',
  'renewed',
  'changed',
  'cancelled',
]);

export const subscriptionHistories = pgTable('subscription_histories', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  subscriptionId: text('subscription_id').references(() => subscriptions.id, {
    onDelete: 'cascade',
  }),
  planId: text('plan_id').references(() => subscriptionPlans.id, {
    onDelete: 'set null',
  }),
  action: text('action', {
    enum: ['subscribed', 'renewed', 'changed', 'cancelled'],
  }).notNull(),
  amountPaid: decimal('amount_paid', { precision: 12, scale: 2 }),
  invoiceRef: text('invoice_ref'),
  periodStart: timestamp('period_start').notNull(),
  periodEnd: timestamp('period_end').notNull(),
  performedBy: text('performed_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscriptionHistoryRelations = relations(subscriptionHistories, ({ one }) => ({
  tenant: one(tenants, {
    fields: [subscriptionHistories.tenantId],
    references: [tenants.id],
  }),
  subscription: one(subscriptions, {
    fields: [subscriptionHistories.subscriptionId],
    references: [subscriptions.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptionHistories.planId],
    references: [subscriptionPlans.id],
  }),
}));

export type SubscriptionHistory = typeof subscriptionHistories.$inferSelect;
export type NewSubscriptionHistory = typeof subscriptionHistories.$inferInsert;
