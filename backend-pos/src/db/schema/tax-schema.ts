import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, decimal } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { outlets } from './outlet-schema';

export const taxes = pgTable('taxes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  outletId: text('outlet_id').references(() => outlets.id),
  nama: text('nama').notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
  isGlobal: boolean('is_global').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const taxesRelations = relations(taxes, ({ one }) => ({
  tenant: one(tenants, {
    fields: [taxes.tenantId],
    references: [tenants.id],
  }),
  outlet: one(outlets, {
    fields: [taxes.outletId],
    references: [outlets.id],
  }),
}));
