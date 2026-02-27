import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { products } from './product-schema';
import { outlets } from './outlet-schema';

export const productStocks = pgTable('product_stocks', {
  id: text('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  productId: text('product_id')
    .references(() => products.id)
    .notNull(),
  outletId: text('outlet_id')
    .references(() => outlets.id)
    .notNull(),
  quantity: integer('quantity').default(0).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productStocksRelations = relations(productStocks, ({ one }) => ({
  product: one(products, {
    fields: [productStocks.productId],
    references: [products.id],
  }),
  outlet: one(outlets, {
    fields: [productStocks.outletId],
    references: [outlets.id],
  }),
}));
