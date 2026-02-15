import { relations } from 'drizzle-orm';
import {
    pgTable,
    serial,
    text,
    timestamp,
    boolean,
    integer,
    decimal, pgEnum,
} from 'drizzle-orm/pg-core';
import { categories } from './category-schema';
import { tenants } from './tenant-schema';
import { productStocks } from './stock-schema';
import { stockAdjustments } from './stock-adjustment-schema';

export const productTypeEnum = pgEnum('product_type', [
    'barang',
    'jasa',
    'digital',
]);

export const products = pgTable('products', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
        .references(() => tenants.id)
        .notNull(),
    sku: text('sku').notNull(),
    barcode: text('barcode'),
    nama: text('nama').notNull(),
    deskripsi: text('deskripsi'),
    categoryId: integer('category_id').references(() => categories.id),
    tipe: productTypeEnum('tipe').default('barang').notNull(),
    hargaBeli: decimal('harga_beli', {
        precision: 12,
        scale: 2,
    }),
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
}));
