import { faker } from '@faker-js/faker';
import { db } from '@/db';
import { products } from '@/db/schema/product-schema';
import { categories } from '@/db/schema/category-schema';
import { eq } from 'drizzle-orm';

export async function seedProduct(tenantId: string) {
  console.log('🌱 Seeding products...');

  const existingProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  if (existingProducts.length > 0) {
    console.log('i  Products already exist');
    return existingProducts.map((p) => p.id);
  }

  const categoryList = await db.query.categories.findMany({
    where: eq(categories.tenantId, tenantId),
  });

  const categoryIds = categoryList.map((c) => c.id);
  if (categoryIds.length === 0) {
    console.warn('⚠️  No categories found, creating products without category');
  }

  const productNames = [
    'Nasi Goreng', 'Mie Goreng', 'Ayam Goreng', 'Ayam Bakar', 'Sate Kebab',
    'Burger', 'Pizza', 'Pasta', 'Lasagna', 'Steak',
    'Espresso', 'Cappuccino', 'Latte', 'Americano', 'Mocha',
    'Jus Apel', 'Jus Jeruk', 'Jus Mangga', 'Smoothie Berry', 'Teh Manis',
    'Kopi Hitam', 'Kopi Susu', 'Matcha Latte', 'Thai Tea', 'Charo',
    'Kentang Goreng', 'Onion Rings', 'Chicken Wings', 'Mozzarella Sticks', 'Spring Roll',
    'Donat', 'Brownies', 'Cheesecake', 'Tiramisu', 'Pudding',
    'Martabak Manis', 'Martabak Asin', 'Roti Bakar', 'Kue Cubir', 'Lumpia',
    'Salad Caesar', 'Soup Ayam', 'Bibimbap', 'Ramen', 'Sushi Roll',
    'Bakso', 'Soto Ayam', 'Gado-gado', 'Nasi Putih', 'Mie Rebus',
  ];

  const generatedProducts: typeof products.$inferInsert[] = [];
  for (let i = 0; i < 50; i++) {
    const name = productNames[i] || faker.commerce.productName();
    const buyPrice = parseFloat(faker.commerce.price({ min: 5000, max: 50000 }));
    const sellPrice = buyPrice * faker.number.float({ min: 1.2, max: 2, fractionDigits: 2 });

    generatedProducts.push({
      tenantId,
      sku: `SKU-${String(i + 1).padStart(4, '0')}`,
      barcode: faker.string.numeric(13),
      nama: name,
      deskripsi: faker.lorem.sentence(),
      categoryId: categoryIds.length > 0 ? faker.helpers.arrayElement(categoryIds) : null,
      tipe: 'barang' as const,
      hargaBeli: buyPrice.toString(),
      hargaJual: sellPrice.toString(),
      unit: 'pcs',
      minStockLevel: faker.number.int({ min: 5, max: 20 }),
      isActive: true,
    });
  }

  await db.insert(products).values(generatedProducts);
  console.log('✅ Created 50 products');

  const newProducts = await db.query.products.findMany({
    where: eq(products.tenantId, tenantId),
  });

  return newProducts.map((p) => p.id);
}
