import { customSessionClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const authClient = createAuthClient({
  baseURL: `${baseApiUrl}/auth`, // Uses nginx proxy
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
