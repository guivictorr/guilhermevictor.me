import { createFileRoute } from "@tanstack/react-router"
import { getAuth } from "@/server/auth.server"

/** Better Auth's endpoints (OAuth callbacks, passkeys, API keys, sessions). */
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => getAuth().handler(request),
      POST: ({ request }) => getAuth().handler(request),
    },
  },
})
