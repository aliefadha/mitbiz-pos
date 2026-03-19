import { relations, sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { proFeatures } from './pro-feature-schema';
import { tenants } from './tenant-schema';

export const roleScopeEnum = pgEnum('role_scope', ['global', 'tenant']);

export const roles = pgTable('roles', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  scope: text('scope', { enum: ['global', 'tenant'] }).notNull(),
  tenantId: text('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
  proFeatureId: text('pro_feature_id').references(() => proFeatures.id, {
    onDelete: 'set null',
  }),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const rolesRelations = relations(roles, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [roles.tenantId],
    references: [tenants.id],
  }),
  proFeature: one(proFeatures, {
    fields: [roles.proFeatureId],
    references: [proFeatures.id],
  }),
}));

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
