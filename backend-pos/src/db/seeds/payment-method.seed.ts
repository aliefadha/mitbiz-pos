import { db } from '@/db';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { eq } from 'drizzle-orm';

export async function seedPaymentMethod(tenantId: string) {
  console.log('🌱 Seeding payment methods...');

  const existingPaymentMethods = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.tenantId, tenantId),
  });

  if (existingPaymentMethods.length > 0) {
    console.log('i  Payment methods already exist');
    return existingPaymentMethods.map((p) => p.id);
  }

  const defaultPaymentMethods = [
    { tenantId, nama: 'Tunai', isActive: true },
    { tenantId, nama: 'Debit Card', isActive: true },
    { tenantId, nama: 'Kredit Card', isActive: true },
    { tenantId, nama: 'QRIS', isActive: true },
    { tenantId, nama: 'GoPay', isActive: true },
    { tenantId, nama: 'OVO', isActive: true },
    { tenantId, nama: 'Dana', isActive: true },
    { tenantId, nama: 'ShopeePay', isActive: true },
    { tenantId, nama: 'Transfer Bank', isActive: true },
  ];

  await db.insert(paymentMethods).values(defaultPaymentMethods);
  console.log('✅ Created payment methods:', defaultPaymentMethods.map((p) => p.nama).join(', '));

  const newPaymentMethods = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.tenantId, tenantId),
  });

  return newPaymentMethods.map((p) => p.id);
}
