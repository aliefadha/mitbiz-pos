import { customSessionClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: `https://backend-pos-508482854424.us-central1.run.app/api/auth`, // Uses nginx proxy
  fetchOptions: {
    credentials: 'include',
  },
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
