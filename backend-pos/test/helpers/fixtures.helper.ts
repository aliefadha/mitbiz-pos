import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { products } from '@/db/schema/product-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { faker } from '@faker-js/faker';

export async function createTenant(
  db: DrizzleDB,
  overrides?: Partial<typeof tenants.$inferInsert>,
) {
  const id = overrides?.id ?? faker.string.uuid();
  const data = {
    id,
    nama: faker.company.name(),
    slug: `${faker.helpers.slugify(faker.company.name().toLowerCase())}-${faker.string.alphanumeric(8)}`,
    isActive: true,
    ...overrides,
  };

  await db.insert(tenants).values(data as typeof tenants.$inferInsert);
  return data;
}

export async function createCategory(
  db: DrizzleDB,
  overrides?: Partial<typeof categories.$inferInsert>,
) {
  const id = overrides?.id ?? faker.string.uuid();
  const data = {
    id,
    tenantId: '',
    nama: faker.commerce.department(),
    deskripsi: faker.lorem.sentence(),
    isActive: true,
    ...overrides,
  };

  await db.insert(categories).values(data as typeof categories.$inferInsert);
  return data;
}

export async function createOutlet(
  db: DrizzleDB,
  overrides?: Partial<typeof outlets.$inferInsert>,
) {
  const id = overrides?.id ?? faker.string.uuid();
  const data = {
    id,
    tenantId: '',
    nama: faker.company.name(),
    kode: faker.string.alphanumeric(3).toUpperCase(),
    alamat: faker.location.streetAddress(),
    noHp: faker.phone.number(),
    isActive: true,
    ...overrides,
  };

  await db.insert(outlets).values(data as typeof outlets.$inferInsert);
  return data;
}

export async function createPaymentMethod(
  db: DrizzleDB,
  overrides?: Partial<typeof paymentMethods.$inferInsert>,
) {
  const id = overrides?.id ?? faker.string.uuid();
  const data = {
    id,
    tenantId: '',
    nama: faker.commerce.productName(),
    isActive: true,
    ...overrides,
  };

  await db.insert(paymentMethods).values(data as typeof paymentMethods.$inferInsert);
  return data;
}

export async function createProduct(
  db: DrizzleDB,
  overrides?: Partial<typeof products.$inferInsert>,
) {
  const id = overrides?.id ?? faker.string.uuid();
  const data = {
    id,
    tenantId: '',
    sku: faker.commerce.isbn(),
    nama: faker.commerce.productName(),
    deskripsi: faker.lorem.sentence(),
    hargaBeli: faker.commerce.price({ min: 1000, max: 50000 }),
    hargaJual: faker.commerce.price({ min: 5000, max: 100000 }),
    unit: 'pcs',
    minStockLevel: 0,
    enableMinStock: false,
    enableStockTracking: true,
    isActive: true,
    ...overrides,
  };

  await db.insert(products).values(data as typeof products.$inferInsert);
  return data;
}
