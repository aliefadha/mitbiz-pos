import { relations, sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { proFeatures } from './pro-feature-schema';
import { subscriptionPlans } from './subscription-plan-schema';

export const planProFeatures = pgTable('plan_pro_features', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  planId: text('plan_id')
    .references(() => subscriptionPlans.id, { onDelete: 'cascade' })
    .notNull(),
  proFeatureId: text('pro_feature_id')
    .references(() => proFeatures.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const planProFeatureRelations = relations(planProFeatures, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [planProFeatures.planId],
    references: [subscriptionPlans.id],
  }),
  proFeature: one(proFeatures, {
    fields: [planProFeatures.proFeatureId],
    references: [proFeatures.id],
  }),
}));

export type PlanProFeature = typeof planProFeatures.$inferSelect;
export type NewPlanProFeature = typeof planProFeatures.$inferInsert;
