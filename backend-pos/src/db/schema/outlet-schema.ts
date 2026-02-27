import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { user } from './auth-schema';
import { productStocks } from './stock-schema';
import { stockAdjustments } from './stock-adjustment-schema';
import { cashShifts } from './cash-shift-schema';

export const outlets = pgTable('outlets', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  nama: text('nama').notNull(),
  kode: text('Kode').notNull(),
  alamat: text('alamat'),
  noHp: text('no_hp'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const outletsRelations = relations(outlets, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [outlets.tenantId],
    references: [tenants.id],
  }),
  stocks: many(productStocks),
  adjustments: many(stockAdjustments),
  cashiers: many(user),
  cashShifts: many(cashShifts),
}));
