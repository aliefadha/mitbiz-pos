import { categories } from '@/db/schema/category-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
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
