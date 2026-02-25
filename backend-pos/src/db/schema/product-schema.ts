import { relations, sql } from 'drizzle-orm';
import { pgTable, text, timestamp, boolean, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { categories } from './category-schema';
import { tenants } from './tenant-schema';
import { productStocks } from './stock-schema';
import { stockAdjustments } from './stock-adjustment-schema';
import { orderItems } from './order-item-schema';

export const productTypeEnum = pgEnum('product_type', [
  'barang',
  'jasa',
  'digital',
]);

export const products = pgTable('products', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tenantId: text('tenant_id')
    .references(() => tenants.id)
    .notNull(),
  sku: text('sku').notNull(),
  barcode: text('barcode'),
  nama: text('nama').notNull(),
  deskripsi: text('deskripsi'),
  categoryId: text('category_id').references(() => categories.id),
  tipe: productTypeEnum('tipe').default('barang').notNull(),
  hargaBeli: decimal('harga_beli', {
    precision: 12,
    scale: 2,
  }).default('0'),
  hargaJual: decimal('harga_jual', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').default('pcs').notNull(),
  minStockLevel: integer('min_stock_level').default(0).notNull(),
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
}));
