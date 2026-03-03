import { db } from '@/db';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { customSession, openAPI } from 'better-auth/plugins';
import { emailService } from './email.service';
import { findUserRoles } from './user.service';

function getAllowedOrigins(): string[] {
  const defaultOrigins = ['http://localhost:3000', 'http://localhost:5173'];

  const envOrigins = process.env.ALLOWED_ORIGINS;
  if (!envOrigins) {
    return defaultOrigins;
  }

  return envOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

const allowedOrigins = getAllowedOrigins();

export const auth = betterAuth({
  url: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  advanced: {
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: true,
    },
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
