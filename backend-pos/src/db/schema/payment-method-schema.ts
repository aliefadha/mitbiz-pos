import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';

export const paymentMethods = pgTable('payment_methods', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  nama: text('nama').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const paymentMethodsRelations = relations(paymentMethods, ({ one }) => ({
  tenant: one(tenants, {
    fields: [paymentMethods.tenantId],
    references: [tenants.id],
  }),
}));
