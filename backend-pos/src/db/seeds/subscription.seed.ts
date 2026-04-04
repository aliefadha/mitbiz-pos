import { db } from '@/db';
import { subscriptionPlans } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function seedSubscriptionPlans() {
  console.log('Seeding subscription plans...');

  const plans = [
    {
      name: 'Pro',
      isActive: true,
      billingCycles: [
        { cycle: 'monthly', price: '200000.00' },
        { cycle: 'quarterly', price: '510000.00' },
        { cycle: 'semi_annual', price: '900000.00' },
        { cycle: 'yearly', price: '1200000.00' },
      ],
    },
  ];

  for (const plan of plans) {
    const existing = await db.query.subscriptionPlans.findFirst({
      where: eq(subscriptionPlans.name, plan.name),
    });

    if (!existing) {
      await db
        .insert(subscriptionPlans)
        .values({
          name: plan.name,
          isActive: plan.isActive,
          billingCycles: plan.billingCycles,
        })
        .returning();

      console.log(`  ✅ Created plan: ${plan.name}`);
    } else {
      console.log(`  ⏭️  Skipped plan: ${plan.name} (already exists)`);
    }
  }
}
