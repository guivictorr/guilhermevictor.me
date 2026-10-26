import { createFileRoute, stripSearchParams } from "@tanstack/react-router"
import { z } from "zod"
import { LibraryView } from "@/components/library/library-view"
import { PageBody, PageHeader } from "@/components/page-header"
import { swipeSearch } from "@/components/swipe/swipe-search"
import { DEFAULT_LIBRARY_QUERY } from "@/lib/repo/library-page"
import { libraryPagesQuery } from "@/queries/archive"

export const Route = createFileRoute("/movies/")({
  // Keep URLs clean: defaults are implied, not written.
  search: { middlewares: [stripSearchParams({ view: "grid" })] },
  validateSearch: z
    .object({
      view: z.enum(["grid", "table"]).catch("grid").default("grid"),
    })
    .extend(swipeSearch.shape),
  loader: ({ context }) =>
    void context.queryClient.prefetchInfiniteQuery(
      libraryPagesQuery("movie", DEFAULT_LIBRARY_QUERY)
    ),
  head: () => ({ meta: [{ title: "Movies · Archive" }] }),
  component: MoviesPage,
})

function MoviesPage() {
  const { view } = Route.useSearch()
  const navigate = Route.useNavigate()
  return (
    <>
      <PageHeader title="Movies" />
      <PageBody className="space-y-4">
        <LibraryView
          type="movie"
          layout={view}
          onLayoutChange={(next) =>
            navigate({ search: { view: next }, replace: true })
          }
        />
      </PageBody>
    </>
  )
}
