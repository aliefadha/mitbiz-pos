import { relations, sql } from 'drizzle-orm';
import { boolean, decimal, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { categories } from './category-schema';
import { discountProducts } from './discount-schema';
import { orderItems } from './order-item-schema';
import { stockAdjustments } from './stock-adjustment-schema';
import { productStocks } from './stock-schema';
import { tenants } from './tenant-schema';

export const products = pgTable('products', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  sku: text('sku').notNull(),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  categoryId: text('category_id').references(() => categories.id),
  hargaBeli: decimal('harga_beli', {
    precision: 12,
    scale: 2,
  }).default('0'),
  hargaJual: decimal('harga_jual', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').default('pcs').notNull(),
  minStockLevel: integer('min_stock_level').default(0).notNull(),
  enableMinStock: boolean('enable_min_stock').default(false).notNull(),
  enableStockTracking: boolean('enable_stock_tracking').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stocks: many(productStocks),
  adjustments: many(stockAdjustments),
  orderItems: many(orderItems),
  discountProducts: many(discountProducts),
}));
