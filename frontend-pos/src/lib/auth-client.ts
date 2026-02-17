import { createAuthClient } from "better-auth/react"
import { customSessionClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
    baseURL: "http://localhost:3001",
    plugins: [customSessionClient()],
})

export const { signIn, signOut, useSession } = authClient