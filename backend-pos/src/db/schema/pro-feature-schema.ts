import { relations, sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { planProFeatures } from './plan-pro-feature-schema';
import { roles } from './role-schema';

export const proFeatures = pgTable('pro_features', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  key: text('key').unique().notNull(),
  name: text('name').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const proFeatureRelations = relations(proFeatures, ({ many }) => ({
  roles: many(roles),
  planProFeatures: many(planProFeatures),
}));

export type ProFeature = typeof proFeatures.$inferSelect;
export type NewProFeature = typeof proFeatures.$inferInsert;
