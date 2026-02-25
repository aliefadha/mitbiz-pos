import { createAuthClient } from "better-auth/react"
import { customSessionClient, inferAdditionalFields } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  baseURL: "http://localhost:3001",
  plugins: [
    customSessionClient(),
    inferAdditionalFields({
      user: {
        role: { type: "string" },
        outletId: { type: "number" },
        isSubscribed: { type: "boolean" },
      },
    })
  ],
})

export const { signIn, signOut, useSession } = authClient
