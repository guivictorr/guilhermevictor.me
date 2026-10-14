import { createFileRoute } from "@tanstack/react-router"
import { MediaType } from "@workspace/schemas"
import { z } from "zod"
import { pgRepository as repo } from "@/server/archive.server"
import { getAuth } from "@/server/auth.server"

/*
 * Read-only API for the personal website (and future tools), authenticated
 * with an API key created in Settings: `Authorization: Bearer arc_…` or
 * `x-api-key: arc_…`. Call it server-side only; the key must stay secret.
 */

const endpoints: Record<string, (params: URLSearchParams) => Promise<unknown>> =
  {
    library: (p) => repo.listLibrary(MediaType.parse(p.get("type"))),
    recent: (p) =>
      repo.listRecent(
        z.coerce.number().int().min(1).max(100).catch(20).parse(p.get("limit"))
      ),
    backlog: () => repo.listBacklog(),
    stats: () => repo.getStats(),
    collection: () => repo.listCollection(),
    flights: () => repo.listFlights(),
    export: () => repo.exportAll(),
  }

function readKey(request: Request) {
  const bearer = request.headers.get("authorization")?.match(/^Bearer (.+)$/i)
  return bearer?.[1] ?? request.headers.get("x-api-key")
}

const json = (status: number, body: unknown) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  })

export const Route = createFileRoute("/api/v1/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const key = readKey(request)
        if (!key) return json(401, { error: "Missing API key" })
        const { valid } = await getAuth().api.verifyApiKey({ body: { key } })
        if (!valid) return json(401, { error: "Invalid API key" })

        const endpoint = endpoints[params._splat ?? ""]
        if (!endpoint)
          return json(404, {
            error: "Unknown endpoint",
            endpoints: Object.keys(endpoints),
          })
        try {
          return json(200, await endpoint(new URL(request.url).searchParams))
        } catch (error) {
          if (error instanceof z.ZodError)
            return json(400, { error: "Invalid query", issues: error.issues })
          throw error
        }
      },
    },
  },
})
