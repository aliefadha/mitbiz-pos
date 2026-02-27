import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { outlets } from './outlet-schema';
import { user } from './auth-schema';

export const cashShiftStatusEnum = pgEnum('status_shift', ['buka', 'tutup']);

export const cashShifts = pgTable('cash_shifts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  outletId: text('outlet_id')
    .references(() => outlets.id)
    .notNull(),
  cashierId: text('cashier_id')
    .references(() => user.id)
    .notNull(),
  jumlahBuka: decimal('jumlah_buka', { precision: 12, scale: 2 }).default('0').notNull(),
  jumlahTutup: decimal('jumlah_tutup', { precision: 12, scale: 2 }).default('0').notNull(),
  jumlahExpected: decimal('jumlah_expected', { precision: 12, scale: 2 }).default('0').notNull(),
  selisih: decimal('selisih', { precision: 12, scale: 2 }).default('0').notNull(),
  status: cashShiftStatusEnum('status').default('buka').notNull(),
  openedAt: timestamp('waktu_buka').defaultNow().notNull(),
  closedAt: timestamp('waktu_tutup'),
  catatan: text('catatan'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cashShiftsRelations = relations(cashShifts, ({ one }) => ({
  tenant: one(tenants, {
    fields: [cashShifts.tenantId],
    references: [tenants.id],
  }),
  outlet: one(outlets, {
    fields: [cashShifts.outletId],
    references: [outlets.id],
  }),
  cashier: one(user, {
    fields: [cashShifts.cashierId],
    references: [user.id],
  }),
}));
