import { db } from '@/db';
import {
  planProFeatures,
  planResources,
  proFeatures,
  resources,
  subscriptionPlans,
} from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function seedSubscriptionPlans() {
  console.log('Seeding subscription plans...');

  const plans = [
    {
      name: 'Free',
      billingCycle: 'monthly' as const,
      price: '0.00',
      isActive: true,
    },
    {
      name: 'Pro Monthly',
      billingCycle: 'monthly' as const,
      price: '99000.00',
      isActive: true,
    },
    {
      name: 'Pro Quarterly',
      billingCycle: 'quarterly' as const,
      price: '270000.00',
      isActive: true,
    },
    {
      name: 'Pro Yearly',
      billingCycle: 'yearly' as const,
      price: '900000.00',
      isActive: true,
    },
  ];

  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, plan.name),
    });

    if (!existing) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`  ✅ Created plan: ${plan.name}`);
    } else {
      console.log(`  ⏭️  Skipped plan: ${plan.name} (already exists)`);
    }
  }
}

export async function seedProFeatures() {
  console.log('Seeding pro features...');

  const features = [
    {
      key: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Access to sales analytics and insights dashboard',
      isActive: true,
    },
    {
      key: 'api_access',
      name: 'API Access',
      description: 'Access to POS API for integrations',
      isActive: true,
    },
    {
      key: 'multiple_outlets',
      name: 'Multiple Outlets',
      description: 'Ability to manage multiple outlets',
      isActive: true,
    },
    {
      key: 'advanced_reports',
      name: 'Advanced Reports',
      description: 'Access to advanced reporting features',
      isActive: true,
    },
    {
      key: 'priority_support',
      name: 'Priority Support',
      description: 'Priority customer support',
      isActive: true,
    },
  ];

  for (const feature of features) {
    const existing = await db.query.proFeatures.findFirst({
      where: eq(proFeatures.key, feature.key),
    });

    if (!existing) {
      await db.insert(proFeatures).values(feature);
      console.log(`  ✅ Created feature: ${feature.name}`);
    } else {
      console.log(`  ⏭️  Skipped feature: ${feature.name} (already exists)`);
    }
  }
}

export async function seedPlanResources() {
  console.log('Seeding plan resources...');

  const allResources = await db.query.resources.findMany({
    where: eq(resources.isActive, true),
  });

  if (allResources.length === 0) {
    console.log('  ⚠️  No resources found. Skipping plan resources seeding.');
    return;
  }

  const proPlans = ['Pro Monthly', 'Pro Quarterly', 'Pro Yearly'];

  for (const planName of proPlans) {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, planName),
    });

    if (!plan) {
      console.log(`  ⚠️  Plan "${planName}" not found. Skipping.`);
      continue;
    }

    const existingPlanResource = await db.query.planResources.findFirst({
      where: eq(planResources.planId, plan.id),
    });

    if (existingPlanResource) {
      console.log(`  ⏭️  Plan resources already exist for "${planName}". Skipping.`);
      continue;
    }

    for (const resource of allResources) {
      await db.insert(planResources).values({
        planId: plan.id,
        resourceId: resource.id,
        isIncluded: true,
      });
    }

    console.log(`  ✅ Linked all resources to "${planName}"`);
  }

  console.log('  ✅ Plan resources seeded successfully');
}

export async function seedPlanProFeatures() {
  console.log('Seeding plan pro features...');

  const allProFeatures = await db.query.proFeatures.findMany({
    where: eq(proFeatures.isActive, true),
  });

  if (allProFeatures.length === 0) {
    console.log('  ⚠️  No pro features found. Skipping plan pro features seeding.');
    return;
  }

  const proPlans = ['Pro Monthly', 'Pro Quarterly', 'Pro Yearly'];

  for (const planName of proPlans) {
    const plan = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, planName),
    });

    if (!plan) {
      console.log(`  ⚠️  Plan "${planName}" not found. Skipping.`);
      continue;
    }

    const existingPlanProFeature = await db.query.planProFeatures.findFirst({
      where: eq(planProFeatures.planId, plan.id),
    });

    if (existingPlanProFeature) {
      console.log(`  ⏭️  Plan pro features already exist for "${planName}". Skipping.`);
      continue;
    }

    for (const proFeature of allProFeatures) {
      await db.insert(planProFeatures).values({
        planId: plan.id,
        proFeatureId: proFeature.id,
      });
    }

    console.log(`  ✅ Linked all pro features to "${planName}"`);
  }

  console.log('  ✅ Plan pro features seeded successfully');
}
