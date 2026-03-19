import { seedCategory } from './category.seed';
import { seedOutlet } from './outlet.seed';
import { seedPaymentMethod } from './payment-method.seed';
import { seedProduct } from './product.seed';
import { seedRbac } from './rbac.seed';
import {
  seedPlanProFeatures,
  seedPlanResources,
  seedProFeatures,
  seedSubscriptionPlans,
} from './subscription.seed';
import { seedTenant } from './tenant.seed';
import { seedOwnerUser, seedUser, updateOwnerTenantId } from './user.seed';

async function main() {
  console.log('Starting database seed...\n');

  console.log('Step 1/10: Seeding RBAC (roles & permissions)...');
  await seedRbac();

  console.log('\nStep 2/10: Seeding subscription plans...');
  await seedSubscriptionPlans();

  console.log('\nStep 3/10: Seeding pro features...');
  await seedProFeatures();

  console.log('\nStep 4/10: Seeding plan pro features...');
  await seedPlanProFeatures();

  console.log('\nStep 5/10: Seeding plan resources...');
  await seedPlanResources();

  console.log('\nStep 6/10: Seeding users...');
  const adminId = await seedUser();
  const ownerId = await seedOwnerUser();

  console.log('\nStep 7/10: Seeding tenant...');
  const tenantId = ownerId ? await seedTenant(ownerId) : null;

  if (tenantId && ownerId) {
    await updateOwnerTenantId(ownerId, tenantId);
  }

  console.log('\nStep 8/10: Seeding outlets...');
  if (tenantId) {
    await seedOutlet(tenantId);
  } else {
    console.warn('⚠️  Skipping outlet seeding: tenant not found');
  }

  console.log('\nStep 9/10: Seeding categories...');
  if (tenantId) {
    await seedCategory(tenantId);
  } else {
    console.warn('⚠️  Skipping category seeding: tenant not found');
  }

  console.log('\nStep 10/10: Seeding products...');
  if (tenantId) {
    await seedProduct(tenantId);
  } else {
    console.warn('⚠️  Skipping product seeding: tenant not found');
  }

  console.log('\nStep 11/11: Seeding payment methods...');
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
