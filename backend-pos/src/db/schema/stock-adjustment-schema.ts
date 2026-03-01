import { relations, sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { outlets } from './outlet-schema';
import { products } from './product-schema';

export const stockAdjustments = pgTable('stock_adjustments', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  outletId: text('outlet_id')
    .references(() => outlets.id)
    .notNull(),
  productId: text('product_id')
    .references(() => products.id)
    .notNull(),
  quantity: integer('quantity').notNull(),
  alasan: text('alasan'),
  adjustedBy: text('adjusted_by')
    .references(() => user.id)
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const stockAdjustmentsRelations = relations(stockAdjustments, ({ one }) => ({
  outlet: one(outlets, {
    fields: [stockAdjustments.outletId],
    references: [outlets.id],
  }),
  product: one(products, {
    fields: [stockAdjustments.productId],
    references: [products.id],
  }),
  user: one(user, {
    fields: [stockAdjustments.adjustedBy],
    references: [user.id],
  }),
}));
