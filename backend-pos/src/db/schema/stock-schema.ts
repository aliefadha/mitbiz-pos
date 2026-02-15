import { relations } from 'drizzle-orm';
import { pgTable, serial, timestamp, integer } from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { products } from './product-schema';
import { outlets } from './outlet-schema';

export const productStocks = pgTable('product_stocks', {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
        .references(() => products.id)
        .notNull(),
    outletId: integer('outlet_id')
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
