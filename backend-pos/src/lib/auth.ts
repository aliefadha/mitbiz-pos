import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession, openAPI } from 'better-auth/plugins';
import { db } from '@/db';
import { emailService } from './email.service';
import { findUserRoles } from './user.service';

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
    customSession(async ({ user, session }) => {
      const roles = await findUserRoles(session.userId);
      return {
        user: {
          ...user,
          roles,
        },
        session,
      };
    }),
  ],
  user: {
    additionalFields: {
      roleId: {
        type: 'string',
        required: false,
      },
      tenantId: {
        type: 'string',
        required: false,
      },
      outletId: {
        type: 'string',
        required: false,
      },
      isSubscribed: {
        type: 'boolean',
        defaultValue: false,
      },
    },
  },
});
