import { db } from '@/db';
import { outlets } from '@/db/schema/outlet-schema';
import { eq } from 'drizzle-orm';

export async function seedOutlet(tenantId: string) {
  console.log('🌱 Seeding outlets...');

  const existingOutlets = await db.query.outlets.findMany({
    where: eq(outlets.tenantId, tenantId),
  });

  if (existingOutlets.length > 0) {
    console.log('i  Outlets already exist');
    return existingOutlets.map((o) => o.id);
  }

  const defaultOutlets = [
    {
      tenantId,
      nama: 'Toko Utama',
      kode: 'OUT1',
      alamat: 'Jakarta Pusat, Indonesia',
      noHp: '+62812345678',
      isActive: true,
    },
    {
      tenantId,
      nama: 'Cabang Selatan',
      kode: 'OUT2',
      alamat: 'Jakarta Selatan, Indonesia',
      noHp: '+62812345679',
      isActive: true,
    },
  ];

  await db.insert(outlets).values(defaultOutlets);
  console.log('✅ Created outlets:', defaultOutlets.map((o) => o.nama).join(', '));

  const newOutlets = await db.query.outlets.findMany({
    where: eq(outlets.tenantId, tenantId),
  });

  return newOutlets.map((o) => o.id);
}
