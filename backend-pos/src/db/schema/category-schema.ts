import { relations } from 'drizzle-orm';
import {
    pgTable,
    serial,
    text,
    timestamp,
    boolean,
    integer,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant-schema';
import { products } from './product-schema';

export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    tenantId: integer('tenant_id')
        .references(() => tenants.id)
        .notNull(),
    nama: text('nama').notNull(),
    deskripsi: text('deskripsi'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    tenant: one(tenants, {
        fields: [categories.tenantId],
        references: [tenants.id],
    }),
    products: many(products),
}));