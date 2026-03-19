import { relations, sql } from 'drizzle-orm';
import { boolean, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { planResources } from './plan-resource-schema';
import { rolePermissions } from './role-permission-schema';

export const resources = pgTable('resources', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').unique().notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const resourcesRelations = relations(resources, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  planResources: many(planResources),
}));

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;
