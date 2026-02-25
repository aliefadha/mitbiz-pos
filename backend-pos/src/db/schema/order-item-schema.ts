
import { relations, sql } from 'drizzle-orm';
import {
  pgTable,
  timestamp,
  text,
  integer,
  decimal,
} from 'drizzle-orm/pg-core';
import { outlets } from './outlet-schema';
import { orders } from './order-schema';
import { products } from './product-schema';

export const orderItems = pgTable('order_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  outletId: text('outlet_id')
    .references(() => outlets.id)
    .notNull(),
  orderId: text('order_id')
    .references(() => orders.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => products.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  hargaSatuan: decimal('harga_satuan', { precision: 12, scale: 2 }).notNull(),
  jumlahDiskon: decimal('jumlah_diskon', { precision: 12, scale: 2 })
    .default('0')
    .notNull(),
  total: decimal('total', { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  outlet: one(outlets, {
    fields: [orderItems.outletId],
    references: [outlets.id],
  }),
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
