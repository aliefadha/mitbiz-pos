import { relations, sql } from 'drizzle-orm';
import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth-schema';
import { cashShifts } from './cash-shift-schema';
import { categories } from './category-schema';
import { outlets } from './outlet-schema';
import { products } from './product-schema';

export const tenants = pgTable('tenants', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  nama: text('nama').notNull(),
  slug: text('slug').unique().notNull(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  settings: jsonb('settings')
    .$type<{
      currency: string;
      timezone: string;
      taxRate: number;
      receiptFooter?: string;
    }>()
    .default({ currency: 'IDR', timezone: 'Asia/Jakarta', taxRate: 0 }),
  image: text('image'),
  alamat: text('alamat'),
  noHp: text('no_hp'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  user: one(user, {
    fields: [tenants.userId],
    references: [user.id],
  }),
  outlets: many(outlets),
  categories: many(categories),
  products: many(products),
  cashShifts: many(cashShifts),
  users: many(user),
}));
