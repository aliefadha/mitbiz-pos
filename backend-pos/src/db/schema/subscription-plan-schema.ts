import { relations, sql } from 'drizzle-orm';
import { boolean, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { subscriptionHistories } from './subscription-history-schema';
import { subscriptions } from './subscription-schema';

export const billingCycleEnum = pgEnum('billing_cycle', [
  'monthly',
  'quarterly',
  'semi_annual',
  'yearly',
]);

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull().default('Pro'),
  isActive: boolean('is_active').default(true).notNull(),
  billingCycles: jsonb('billing_cycles')
    .$type<Array<{ cycle: string; price: string }>>()
    .default([])
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
  subscriptionHistories: many(subscriptionHistories),
}));

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
