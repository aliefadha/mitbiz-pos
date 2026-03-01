import { db } from '@/db';
import { user } from '@/db/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

const GLOBAL_ADMIN_ROLE_ID = '00000000-0000-0000-0000-000000000001';

export async function seedUser() {
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
      return;
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
        .set({ roleId: GLOBAL_ADMIN_ROLE_ID, emailVerified: true, isSubscribed: true })
        .where(eq(user.id, result.user.id));
      console.log('✅ Created superadmin user with admin role:', result.user.email);
    }
  } catch (error) {
    console.error('❌ Error seeding user:', error);
  }
}

seedUser();
