import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin, openAPI } from 'better-auth/plugins';
import { db } from '../db';

export const auth = betterAuth({
  url: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: { enabled: true },
  trustedOrigins: ['http://localhost:3000'],
  plugins: [openAPI(), admin()],
  user: {
    additionalFields: {
      role: {
        type: ["admin", "owner", "cashier"],
        required: false,
        defaultValue: 'cashier',
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
});
