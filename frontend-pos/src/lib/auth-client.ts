import { customSessionClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3001',
  plugins: [
    customSessionClient(),
    inferAdditionalFields({
      user: {
        roleId: { type: 'string' },
        tenantId: { type: 'string' },
        outletId: { type: 'string' },
        isSubscribed: { type: 'boolean' },
      },
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
