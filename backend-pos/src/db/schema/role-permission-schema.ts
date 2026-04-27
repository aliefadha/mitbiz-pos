import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { resources } from './resource-schema';
import { roles } from './role-schema';

export const rolePermissions = pgTable('role_permissions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  roleId: text('role_id')
    .references(() => roles.id, { onDelete: 'cascade' })
    .notNull(),
  resourceId: text('resource_id')
    .references(() => resources.id, { onDelete: 'cascade' })
    .notNull(),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  resource: one(resources, {
    fields: [rolePermissions.resourceId],
    references: [resources.id],
  }),
}));

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
