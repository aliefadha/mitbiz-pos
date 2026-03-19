import { relations, sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { resources } from './resource-schema';
import { subscriptionPlans } from './subscription-plan-schema';

export const planResources = pgTable('plan_resources', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  planId: text('plan_id')
    .references(() => subscriptionPlans.id, { onDelete: 'cascade' })
    .notNull(),
  resourceId: text('resource_id')
    .references(() => resources.id, { onDelete: 'cascade' })
    .notNull(),
  isIncluded: boolean('is_included').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const planResourceRelations = relations(planResources, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [planResources.planId],
    references: [subscriptionPlans.id],
  }),
  resource: one(resources, {
    fields: [planResources.resourceId],
    references: [resources.id],
  }),
}));

export type PlanResource = typeof planResources.$inferSelect;
export type NewPlanResource = typeof planResources.$inferInsert;
