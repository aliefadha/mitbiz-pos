import { db } from '@/db';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const GLOBAL_ADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000001';
const TEMPLATE_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000010';

export async function seedUser(): Promise<string | null> {
  console.log('🌱 Seeding user...');
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@mitbiz.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

    const existingUser = await db.query.user.findFirst({
      where: eq(user.email, adminEmail),
    });

    if (existingUser) {
      console.log('i  Admin user already exists');

      if (!existingUser.roleId) {
        await db
          .update(user)
          .set({ roleId: GLOBAL_ADMIN_ROLE_ID })
          .where(eq(user.id, existingUser.id));
        console.log('✅ Updated existing user with admin role');
      }
      return existingUser.id;
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
      },
    });

    if (result.user) {
      await db
        .update(user)
        .set({ roleId: GLOBAL_ADMIN_ROLE_ID, emailVerified: true })
        .where(eq(user.id, result.user.id));
      console.log('✅ Created superadmin user with admin role:', result.user.email);
      return result.user.id;
    }
    return null;
  } catch (error) {
    console.error('❌ Error seeding user:', error);
    return null;
  }
}

export async function seedOwnerUser(): Promise<string | null> {
  console.log('🌱 Seeding owner user...');
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'owner@mitbiz.com';
    const ownerPassword = process.env.OWNER_PASSWORD || '12345678';

    const existingOwner = await db.query.user.findFirst({
      where: eq(user.email, ownerEmail),
    });

    if (existingOwner) {
      console.log('i  Owner user already exists');

      if (!existingOwner.roleId) {
        await db
          .update(user)
          .set({ roleId: TEMPLATE_OWNER_ROLE_ID })
          .where(eq(user.id, existingOwner.id));
        console.log('✅ Updated existing user with owner role');
      }
      return existingOwner.id;
    }

    const result = await auth.api.signUpEmail({
      body: {
        email: ownerEmail,
        password: ownerPassword,
        name: 'Owner',
      },
    });

    if (result.user) {
      await db
        .update(user)
        .set({ roleId: TEMPLATE_OWNER_ROLE_ID, emailVerified: true })
        .where(eq(user.id, result.user.id));
      console.log('✅ Created owner user with owner role:', result.user.email);
      return result.user.id;
    }
    return null;
  } catch (error) {
    console.error('❌ Error seeding owner user:', error);
    return null;
  }
}

export async function updateOwnerTenantId(ownerId: string, tenantId: string): Promise<void> {
  console.log('🌱 Updating owner tenantId...');
  try {
    await db.update(user).set({ tenantId }).where(eq(user.id, ownerId));
    console.log('✅ Updated owner tenantId');
  } catch (error) {
    console.error('❌ Error updating owner tenantId:', error);
  }
}
