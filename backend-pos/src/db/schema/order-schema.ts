import { relations, sql } from 'drizzle-orm';
import { decimal, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { pgEnum } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { cashShifts } from './cash-shift-schema';
import { orderItems } from './order-item-schema';
import { outlets } from './outlet-schema';
import { paymentMethods } from './payment-method-schema';
import { tenants } from './tenant-schema';

export const orderStatusEnum = pgEnum('order_status', ['complete', 'cancel', 'refunded']);

export const orders = pgTable('orders', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  outletId: text('outlet_id')
    .references(() => outlets.id)
    .notNull(),
  orderNumber: text('order_number').notNull(),
  cashierId: text('cashier_id')
    .references(() => user.id)
    .notNull(),
  cashShiftId: text('cash_shift_id').references(() => cashShifts.id),
  status: orderStatusEnum('status').default('complete').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  jumlahPajak: decimal('jumlah_pajak', { precision: 12, scale: 2 }).default('0').notNull(),
  jumlahDiskon: decimal('jumlah_diskon', { precision: 12, scale: 2 }).default('0').notNull(),
  diskonBreakdown:
    jsonb('diskon_breakdown').$type<
      {
        discountId: string;
        nama: string;
        rate: string;
        amount: number;
      }[]
    >(),
  paymentMethodId: text('payment_method_id').references(() => paymentMethods.id),
  total: decimal('total', { precision: 12, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  nomorAntrian: text('nomor_antrian'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [orders.tenantId],
    references: [tenants.id],
  }),
  outlet: one(outlets, {
    fields: [orders.outletId],
    references: [outlets.id],
  }),
  cashier: one(user, {
    fields: [orders.cashierId],
    references: [user.id],
  }),
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  cashShift: one(cashShifts, {
    fields: [orders.cashShiftId],
    references: [cashShifts.id],
  }),
  orderItems: many(orderItems),
}));
