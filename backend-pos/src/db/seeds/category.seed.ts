import { db } from '@/db';
import { categories } from '@/db/schema/category-schema';
import { eq } from 'drizzle-orm';

export async function seedCategory(tenantId: string) {
  console.log('🌱 Seeding categories...');

  const existingCategories = await db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
  });

  if (existingCategories.length > 0) {
    console.log('i  Categories already exist');
    return existingCategories.map((c) => c.id);
  }

  const defaultCategories = [
    {
      tenantId,
      nama: 'Makanan',
      deskripsi: 'Berbagai jenis makanan',
      isActive: true,
    },
    {
      tenantId,
      nama: 'Minuman',
      deskripsi: 'Berbagai jenis minuman',
      isActive: true,
    },
    {
      tenantId,
      nama: 'Snack',
      deskripsi: 'Makanan ringan dan camilan',
      isActive: true,
    },
    {
      tenantId,
      nama: 'Dessert',
      deskripsi: 'Pencuci mulut',
      isActive: true,
    },
  ];

  await db.insert(categories).values(defaultCategories);
  console.log('✅ Created categories:', defaultCategories.map((c) => c.nama).join(', '));

  const newCategories = await db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
  });

  return newCategories.map((c) => c.id);
}
