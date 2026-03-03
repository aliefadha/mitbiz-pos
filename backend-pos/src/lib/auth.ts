import { db } from '@/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession, openAPI } from 'better-auth/plugins';
import { emailService } from './email.service';
import { findUserRoles } from './user.service';

// Fix: BETTER_AUTH_URL now uses actual Cloud Run URL
// Testing env-vars-file deployment
// Trigger rebuild v2
// Hardcoded for production
const BASE_URL = 'https://backend-pos-508482854424.us-central1.run.app';
const allowedOrigins = ['https://frontend-pos-508482854424.us-central1.run.app'];

console.log('Better Auth baseURL:', BASE_URL);

export const auth = betterAuth({
  url: BASE_URL,
  baseURL: BASE_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  advanced: {
    useSecureCookies: true,
    crossOrigin: {
      trustedOrigins: allowedOrigins,
    },
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
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
  trustedOrigins: allowedOrigins,
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
