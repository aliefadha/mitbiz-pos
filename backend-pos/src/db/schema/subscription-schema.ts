import { relations, sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subscriptionHistories } from './subscription-history-schema';
import { subscriptionPlans } from './subscription-plan-schema';
import { tenants } from './tenant-schema';

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'expired',
  'cancelled',
  'suspended',
]);

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id, { onDelete: 'cascade' })
    .notNull(),
  planId: text('plan_id').references(() => subscriptionPlans.id, { onDelete: 'set null' }),
  status: text('status', {
    enum: ['active', 'expired', 'cancelled', 'suspended'],
  })
    .notNull()
    .default('active'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionRelations = relations(subscriptions, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subscriptions.tenantId],
    references: [tenants.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [subscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  histories: many(subscriptionHistories),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
