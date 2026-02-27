import { auth } from '@/lib/auth';

export async function seedUser() {
  console.log('🌱 Seeding user...');
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'superadmin@mitbiz.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '12345678';

    const result = await auth.api.createUser({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: 'Super Admin',
        role: 'admin',
      },
    });

    console.log('✅ Created test superadmin user:', result.user.email);
  } catch (error) {
    console.error('❌ Error seeding user:', error);
  }
}

seedUser();
