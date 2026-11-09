import { createMiddleware, createServerFn } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { getAuth } from "./auth.server"

/*
 * Every server function that touches archive or provider data uses
 * `requireOwner`. Route guards (`beforeLoad`) are only for UX; this is the
 * actual security boundary.
 */

async function readSession() {
  return getAuth().api.getSession({ headers: getRequestHeaders() })
}

export const requireOwner = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const session = await readSession()
    if (!session) throw new Error("Unauthorized")
    return next({ context: { user: session.user } })
  }
)

/** Who's signed in (or null). Used by the router to redirect to /login. */
export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  const session = await readSession()
  if (!session) return null
  const { name, email, image } = session.user
  return { name, email, image: image ?? undefined }
})
