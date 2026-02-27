import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, decimal, jsonb } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { outlets } from './outlet-schema';
import { user } from './auth-schema';
import { pgEnum } from 'drizzle-orm/pg-core';
import { orderItems } from './order-item-schema';
import { paymentMethods } from './payment-method-schema';

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
  status: orderStatusEnum('status').default('complete').notNull(),
  subtotal: decimal('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  jumlahPajak: decimal('jumlah_pajak', { precision: 12, scale: 2 }).default('0').notNull(),
  pajakBreakdown:
    jsonb('pajak_breakdown').$type<
      {
        taxId: string;
        nama: string;
        rate: string;
        amount: number;
      }[]
    >(),
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
  paymentMethod: one(paymentMethods, {
    fields: [orders.paymentMethodId],
    references: [paymentMethods.id],
  }),
  orderItems: many(orderItems),
}));
