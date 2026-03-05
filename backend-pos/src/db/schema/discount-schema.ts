import { relations, sql } from 'drizzle-orm';
import { boolean, decimal, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { outlets } from './outlet-schema';
import { products } from './product-schema';
import { tenants } from './tenant-schema';

export const discountScopeEnum = pgEnum('discount_scope', ['product', 'transaction']);

export const discountLevelEnum = pgEnum('discount_level', ['tenant', 'outlet']);

export const discountProducts = pgTable('discount_products', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  discountId: text('discount_id')
    .references(() => discounts.id, { onDelete: 'cascade' })
    .notNull(),
  productId: text('product_id')
    .references(() => products.id, { onDelete: 'cascade' })
    .notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const discounts = pgTable('discounts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  outletId: text('outlet_id').references(() => outlets.id),
  nama: text('nama').notNull(),
  rate: decimal('rate', { precision: 5, scale: 2 }).notNull(),
  scope: discountScopeEnum('scope').default('transaction').notNull(),
  level: discountLevelEnum('level').default('tenant').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const discountsRelations = relations(discounts, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [discounts.tenantId],
    references: [tenants.id],
  }),
  outlet: one(outlets, {
    fields: [discounts.outletId],
    references: [outlets.id],
  }),
  products: many(discountProducts),
}));

export const discountProductsRelations = relations(discountProducts, ({ one }) => ({
  discount: one(discounts, {
    fields: [discountProducts.discountId],
    references: [discounts.id],
  }),
  product: one(products, {
    fields: [discountProducts.productId],
    references: [products.id],
  }),
}));
