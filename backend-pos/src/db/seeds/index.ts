import { seedRbac } from './rbac.seed';
import { seedUser, seedOwnerUser, updateOwnerTenantId } from './user.seed';
import { seedTenant } from './tenant.seed';
import { seedOutlet } from './outlet.seed';
import { seedCategory } from './category.seed';
import { seedProduct } from './product.seed';
import { seedPaymentMethod } from './payment-method.seed';

async function main() {
  console.log('Starting database seed...\n');

  console.log('Step 1/7: Seeding RBAC (roles & permissions)...');
  await seedRbac();

  console.log('\nStep 2/7: Seeding users...');
  const adminId = await seedUser();
  const ownerId = await seedOwnerUser();

  console.log('\nStep 3/7: Seeding tenant...');
  const tenantId = ownerId ? await seedTenant(ownerId) : null;

  if (tenantId && ownerId) {
    await updateOwnerTenantId(ownerId, tenantId);
  }

  console.log('\nStep 4/7: Seeding outlets...');
  if (tenantId) {
    await seedOutlet(tenantId);
  } else {
    console.warn('⚠️  Skipping outlet seeding: tenant not found');
  }

  console.log('\nStep 5/7: Seeding categories...');
  if (tenantId) {
    await seedCategory(tenantId);
  } else {
    console.warn('⚠️  Skipping category seeding: tenant not found');
  }

  console.log('\nStep 6/7: Seeding products...');
  if (tenantId) {
    await seedProduct(tenantId);
  } else {
    console.warn('⚠️  Skipping product seeding: tenant not found');
  }

  console.log('\nStep 7/7: Seeding payment methods...');
  if (tenantId) {
    await seedPaymentMethod(tenantId);
  } else {
    console.warn('⚠️  Skipping payment method seeding: tenant not found');
  }

  console.log('\n✅ All seeding completed!');
}

main()
  .catch((error) => {
    console.error('Error during seeding:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
