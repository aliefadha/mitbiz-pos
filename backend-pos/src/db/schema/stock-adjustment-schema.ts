import { relations } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, integer } from 'drizzle-orm/pg-core';
import { products } from './product-schema';
import { user } from './auth-schema';
import { outlets } from './outlet-schema';

export const stockAdjustments = pgTable('stock_adjustments', {
    id: serial('id').primaryKey(),
    outletId: integer('outlet_id')
        .references(() => outlets.id)
        .notNull(),
    productId: integer('product_id')
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
