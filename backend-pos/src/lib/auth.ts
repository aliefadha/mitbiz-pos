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
const BASE_URL =
  process.env.BETTER_AUTH_URL || 'https://backend-pos-508482854424.us-central1.run.app';
const getAllowedOrigins = (): string[] => {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];
  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) {
    return defaultOrigins;
  }
  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = getAllowedOrigins();

console.log('Better Auth baseURL:', BASE_URL);
console.log('Better Auth allowed origins:', allowedOrigins);
console.log('ALLOWED_ORIGINS env raw:', process.env.ALLOWED_ORIGINS);

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
      path: '/',
    },
  },
  trustedOrigins: allowedOrigins,
  session: {
    cookieCache: {
      enabled: false,
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
