import { db } from '@/db';
import { tenants } from '@/db/schema/tenant-schema';
import { eq } from 'drizzle-orm';

export async function seedTenant(adminUserId: string) {
  console.log('🌱 Seeding tenant...');

  const existingTenant = await db.query.tenants.findFirst();

  if (existingTenant) {
    console.log('i  Tenant already exists');
    return existingTenant.id;
  }

  const tenantData = {
    nama: 'Mitbiz POS',
    slug: 'mitbiz-pos',
    userId: adminUserId,
    settings: {
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      taxRate: 10,
      receiptFooter: 'Terima kasih telah berbelanja di Mitbiz POS',
    },
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    alamat: 'Jakarta, Indonesia',
    noHp: '+62812345678',
    isActive: true,
  };

  await db.insert(tenants).values(tenantData);
  console.log('✅ Created tenant:', tenantData.nama);

  const newTenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, tenantData.slug),
  });

  return newTenant?.id;
}
