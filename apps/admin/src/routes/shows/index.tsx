import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { LibraryNav } from "@/components/library/library-nav"
import { LibraryView } from "@/components/library/library-view"
import { PageBody, PageHeader } from "@/components/page-header"
import { swipeSearch } from "@/components/swipe/swipe-search"
import { DEFAULT_LIBRARY_QUERY } from "@/lib/repo/library-page"
import { libraryPagesQuery } from "@/queries/archive"

export const Route = createFileRoute("/shows/")({
  // Keep URLs clean: defaults are implied, not written.
  search: { middlewares: [stripSearchParams({ view: "grid" })] },
  validateSearch: z
    .object({
      view: z.enum(["grid", "table"]).catch("grid").default("grid"),
    })
    .extend(swipeSearch.shape),
  loader: ({ context }) =>
    void context.queryClient.prefetchInfiniteQuery(
      libraryPagesQuery("show", DEFAULT_LIBRARY_QUERY)
    ),
  head: () => ({ meta: [{ title: "Shows · Archive" }] }),
  component: ShowsPage,
})

function ShowsPage() {
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <>
      <PageHeader title="Shows" />
      <PageBody className="space-y-4">
        <LibraryNav />
        <LibraryView
          type="show"
          layout={view}
          onLayoutChange={(next) =>
            navigate({ search: { view: next }, replace: true })
          }
        />
      </PageBody>
    </>
  )
}
