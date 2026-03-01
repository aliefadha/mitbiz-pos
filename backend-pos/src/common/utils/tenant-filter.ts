import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { type SQL, eq, sql } from 'drizzle-orm';

export async function getProductIdsByTenant(db: DrizzleDB, tenantId: string): Promise<string[]> {
  const productIdsInTenant = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.tenantId, tenantId));

  return productIdsInTenant.map((p) => p.id);
}

export async function buildTenantFilter(
  db: DrizzleDB,
  tenantId: string,
): Promise<SQL<unknown> | undefined> {
  const productIds = await getProductIdsByTenant(db, tenantId);

  if (productIds.length === 0) {
    return sql`false`;
  }

  return sql`${products.id} IN (${sql.join(
    productIds.map((id) => sql`${id}`),
    sql`, `,
  )})`;
}
