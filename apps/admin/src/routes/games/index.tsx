import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { LibraryNav } from "@/components/library/library-nav"
import { LibraryView } from "@/components/library/library-view"
import { PageBody, PageHeader } from "@/components/page-header"

export const Route = createFileRoute("/games/")({
  // Keep URLs clean: defaults are implied, not written.
  search: { middlewares: [stripSearchParams({ view: "grid" })] },
  validateSearch: z.object({
    view: z.enum(["grid", "table"]).catch("grid").default("grid"),
  }),
  head: () => ({ meta: [{ title: "Games · Archive" }] }),
  component: GamesPage,
})

function GamesPage() {
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <>
      <PageHeader title="Games" />
      <PageBody className="space-y-4">
        <LibraryNav />
        <LibraryView
          type="game"
          layout={view}
          onLayoutChange={(next) =>
            navigate({ search: { view: next }, replace: true })
          }
        />
      </PageBody>
    </>
  )
}
