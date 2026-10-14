import { passkeyClient } from "@better-auth/passkey/client"
import { createAuthClient } from "better-auth/react"

/** Same origin as the app, so no baseURL is needed. */
export const authClient = createAuthClient({
  plugins: [passkeyClient()],
})
