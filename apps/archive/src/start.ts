import { createCsrfMiddleware, createStart } from "@tanstack/react-start"

/*
 * Server-function writes must come from the app itself. Better Auth checks
 * origins on its own routes, and /api/v1 is read-only (API key).
 */
const csrf = createCsrfMiddleware({
  filter: ({ request }) =>
    request.method !== "GET" &&
    new URL(request.url).pathname.startsWith("/_serverFn"),
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrf],
}))
