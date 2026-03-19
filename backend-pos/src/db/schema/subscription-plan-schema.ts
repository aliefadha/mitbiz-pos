import { relations, sql } from 'drizzle-orm';
import { boolean, decimal, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { planProFeatures } from './plan-pro-feature-schema';
import { planResources } from './plan-resource-schema';
import { subscriptionHistories } from './subscription-history-schema';
import { subscriptions } from './subscription-schema';

export const billingCycleEnum = pgEnum('billing_cycle', ['monthly', 'quarterly', 'yearly']);

export const subscriptionPlans = pgTable('subscription_plans', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  billingCycle: text('billing_cycle', { enum: ['monthly', 'quarterly', 'yearly'] })
    .notNull()
    .default('monthly'),
  price: decimal('price', { precision: 12, scale: 2 }).notNull().default('0'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptionPlanRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(subscriptions),
  subscriptionHistories: many(subscriptionHistories),
  planResources: many(planResources),
  planProFeatures: many(planProFeatures),
}));

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
