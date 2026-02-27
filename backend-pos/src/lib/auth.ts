import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, openAPI } from 'better-auth/plugins';
import { db } from '@/db';
import { ac, adminRole, ownerRole, cashierRole } from './permissions';
import { emailService } from './email.service';

export const auth = betterAuth({
  url: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await emailService.sendPasswordResetEmail(user.email, url);
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await emailService.sendVerificationEmail(user.email, url);
    },
    sendOnSignUp: true,
    expiresIn: 24 * 60 * 60,
    autoSignInAfterVerification: false,
  },
  trustedOrigins: ['http://localhost:3000'],
  plugins: [
    openAPI(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        owner: ownerRole,
        cashier: cashierRole,
      },
      defaultRole: 'owner',
    }),
  ],
  user: {
    additionalFields: {
      role: {
        type: ['admin', 'owner', 'cashier'],
        required: false,
        defaultValue: 'owner',
      },
      outletId: {
        type: 'number',
        required: false,
      },
      isSubscribed: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
  customSession: async ({ user }) => {
    return {
      role: user.role,
      outletId: user.outletId,
      isSubscribed: user.isSubscribed,
    };
  },
});
