import { db } from '@/db';
import { rolePermissions, roles, subscriptionHistories, subscriptions, tenants } from '@/db/schema';
import { subscriptionPlans } from '@/db/schema';
import { user } from '@/db/schema/auth-schema';
import { eq } from 'drizzle-orm';

const TEMPLATE_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000010';
const TEMPLATE_CASHIER_ROLE_ID = '00000000-0000-0000-0000-000000000011';

export async function seedTenant(adminUserId: string) {
  console.log('🌱 Seeding tenant...');

  const existingTenant = await db.query.tenants.findFirst();

  if (existingTenant) {
    console.log('i  Tenant already exists');
    return existingTenant.id;
  }

  const tenantData = {
    nama: 'Mitbiz POS',
    slug: 'MIT',
    userId: adminUserId,
    settings: {
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      taxRate: 10,
      receiptFooter: 'Terima kasih telah berbelanja di Mitbiz POS',
      enableOrderTipe: true,
    },
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400',
    alamat: 'Jakarta, Indonesia',
    noHp: '+62812345678',
    isActive: true,
  };

  const [newTenant] = await db.insert(tenants).values(tenantData).returning();
  console.log('✅ Created tenant:', tenantData.nama);

  const [templateOwnerRole, templateCashierRole] = await Promise.all([
    db.query.roles.findFirst({
      where: eq(roles.id, TEMPLATE_OWNER_ROLE_ID),
    }),
    db.query.roles.findFirst({
      where: eq(roles.id, TEMPLATE_CASHIER_ROLE_ID),
    }),
  ]);

  const [templateOwnerPermissions, templateCashierPermissions] = await Promise.all([
    db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, TEMPLATE_OWNER_ROLE_ID),
    }),
    db.query.rolePermissions.findMany({
      where: eq(rolePermissions.roleId, TEMPLATE_CASHIER_ROLE_ID),
    }),
  ]);

  if (templateOwnerRole) {
    const [newOwnerRole] = await db
      .insert(roles)
      .values({
        name: templateOwnerRole.name,
        scope: templateOwnerRole.scope,
        tenantId: newTenant.id,
        description: templateOwnerRole.description,
        isActive: true,
        isDefault: true,
      })
      .returning();

    if (newOwnerRole && templateOwnerPermissions.length > 0) {
      await db.insert(rolePermissions).values(
        templateOwnerPermissions.map((perm) => ({
          roleId: newOwnerRole.id,
          resource: perm.resource,
          action: perm.action,
        })),
      );
    }

    await db
      .update(user)
      .set({ roleId: newOwnerRole.id, tenantId: newTenant.id })
      .where(eq(user.id, adminUserId));

    console.log('✅ Cloned owner role and assigned to admin user');
  }

  if (templateCashierRole) {
    const [newCashierRole] = await db
      .insert(roles)
      .values({
        name: templateCashierRole.name,
        scope: templateCashierRole.scope,
        tenantId: newTenant.id,
        description: templateCashierRole.description,
        isActive: true,
        isDefault: false,
      })
      .returning();

    if (newCashierRole && templateCashierPermissions.length > 0) {
      await db.insert(rolePermissions).values(
        templateCashierPermissions.map((perm) => ({
          roleId: newCashierRole.id,
          resource: perm.resource,
          action: perm.action,
        })),
      );
    }

    console.log('✅ Cloned cashier role');
  }

  const proPlan = await db.query.subscriptionPlans.findFirst({
    where: eq(subscriptionPlans.name, 'Pro'),
  });

  if (proPlan) {
    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + 365 * 24 * 60 * 60 * 1000);

    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        tenantId: newTenant.id,
        planId: proPlan.id,
        billingCycle: 'yearly',
        status: 'active',
        startedAt,
        expiresAt,
      })
      .returning();

    await db.insert(subscriptionHistories).values({
      tenantId: newTenant.id,
      subscriptionId: newSubscription.id,
      planId: proPlan.id,
      action: 'subscribed',
      periodStart: startedAt,
      periodEnd: expiresAt,
      performedBy: adminUserId,
    });

    console.log('✅ Created subscription for tenant');
  }

  return newTenant.id;
}
