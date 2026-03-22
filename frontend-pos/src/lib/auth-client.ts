import { customSessionClient, inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const baseApiUrl = import.meta.env.VITE_API_URL || '/api';
const baseURL = `${baseApiUrl}/api/auth`;

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: 'include',
  },
  plugins: [
    customSessionClient(),
    inferAdditionalFields({
      user: {
        roleId: { type: 'string' },
        roleScope: { type: 'string' },
        tenantId: { type: 'string' },
        outletId: { type: 'string' },
      },
    }),
  ],
});

export const { signIn, signOut, useSession } = authClient;
