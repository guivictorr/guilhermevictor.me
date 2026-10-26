import { useQueryClient, useSuspenseInfiniteQuery } from "@tanstack/react-query"
import { Link, useNavigate } from "@tanstack/react-router"
import {
  createColumnHelper,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import type { SortingState } from "@tanstack/react-table"
import type { MediaType } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
} from "lucide-react"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import { toast } from "sonner"
import { LibraryNav } from "./library-nav"
import { statusLabel } from "@/lib/status"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
  MediaLink,
} from "@/components/media-card"
import { SwipeDeck } from "@/components/swipe/swipe-deck"
import { useSwipe } from "@/components/swipe/swipe-search"
import { Poster } from "@/components/poster"
import { StarRating } from "@/components/star-rating"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatDate } from "@/lib/format"
import { KINDS } from "@/lib/media-kinds"
import type { LibraryEntry } from "@/lib/repo"
import { LoadMore } from "@/components/load-more"
import { DEFAULT_LIBRARY_QUERY, LIBRARY_SORTS } from "@/lib/repo/library-page"
import type { LibraryPageQuery } from "@/lib/repo/library-page"
import { libraryPagesQuery, libraryQuery } from "@/queries/archive"
import { ListToolbar, ViewSwitch } from "@/components/list-toolbar"
import { SearchField, SurpriseButton } from "@/components/search-field"
import { DETAIL_ROUTE } from "@/lib/detail-routes"
import { SuspenseSection } from "@/components/loaders"

// Sorting happens on the server (pages arrive in order); the table only
// keeps the sort state for its header buttons.
const features = tableFeatures({
  rowSortingFeature,
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    text: sortFn_text,
    basic: sortFn_basic,
  },
})

const helper = createColumnHelper<typeof features, LibraryEntry>()

const columns = helper.columns([
  helper.accessor("title", {
    header: "Title",
    sortFn: "text",
    cell: (info) => (
      <MediaLink
        media={info.row.original}
        className="flex items-center gap-3 font-medium hover:underline"
      >
        <Poster
          image={info.row.original.poster}
          type={info.row.original.type}
          title={info.row.original.title}
          size="thumb"
          className="w-9 shrink-0 rounded"
        />
        <span className="truncate">{info.getValue()}</span>
      </MediaLink>
    ),
  }),
  helper.accessor("year", {
    header: "Year",
    sortFn: "basic",
    sortUndefined: "last",
    cell: (info) => info.getValue() ?? "—",
  }),
  helper.accessor("rating", {
    header: "Rating",
    sortFn: "basic",
    sortUndefined: "last",
    cell: (info) => <StarRating rating={info.getValue()} className="text-sm" />,
  }),
  helper.accessor("status", {
    header: "Status",
    enableSorting: false,
    cell: (info) => {
      const label = statusLabel(info.getValue())
      return label ? <Badge variant="secondary">{label}</Badge> : null
    },
  }),
  helper.accessor("logCount", {
    header: "Logs",
    sortFn: "basic",
    cell: (info) => <span className="tabular-nums">{info.getValue()}</span>,
  }),
  helper.accessor("lastLoggedAt", {
    header: "Last logged",
    sortFn: "alphanumeric",
    sortUndefined: "last",
    cell: (info) => formatDate(info.getValue()) ?? "—",
  }),
])

const SORT_OPTIONS = [
  {
    value: "recent",
    label: "Recently logged",
    sorting: [{ id: "lastLoggedAt", desc: true }],
  },
  { value: "title", label: "Title", sorting: [{ id: "title", desc: false }] },
  { value: "rating", label: "Rating", sorting: [{ id: "rating", desc: true }] },
  {
    value: "year",
    label: "Release year",
    sorting: [{ id: "year", desc: true }],
  },
] as const satisfies ReadonlyArray<{
  value: string
  label: string
  sorting: SortingState
}>

export type LibraryLayout = "grid" | "table"

type LibraryViewProps = {
  type: MediaType
  layout: LibraryLayout
  onLayoutChange: (layout: LibraryLayout) => void
}

/**
 * A kind's library (the route's loader prefetches it), under the same
 * header as Search: a big filter field with Surprise me, the kind pills,
 * then the count, order and view (grid / table / swipe).
 */
export function LibraryView(props: LibraryViewProps) {
  const [filter, setFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: DEFAULT_LIBRARY_QUERY.sort, desc: DEFAULT_LIBRARY_QUERY.desc },
  ])
  const surprise = useLibrarySurprise(props.type)
  const noun = KINDS[props.type].plural.toLowerCase()
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <SearchField
          value={filter}
          onChange={setFilter}
          label={`Filter ${noun}`}
          placeholder={`Filter your ${noun}`}
        />
        <SurpriseButton onClick={() => void surprise()} />
      </div>
      <LibraryNav />
      <SuspenseSection fallback={<MediaGridSkeleton />}>
        <Library
          {...props}
          filter={filter}
          sorting={sorting}
          onSortingChange={setSorting}
        />
      </SuspenseSection>
    </div>
  )
}

/** Opens one of your works of this kind at random. */
function useLibrarySurprise(type: MediaType) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return async () => {
    const entries = await queryClient.fetchQuery(libraryQuery(type))
    const pick = entries[Math.floor(Math.random() * entries.length)]
    if (!pick) {
      toast(`No ${KINDS[type].plural.toLowerCase()} yet`)
      return
    }
    void navigate({
      to: DETAIL_ROUTE[type],
      params: { id: String(pick.id) },
    })
  }
}

function Library({
  type,
  layout,
  onLayoutChange,
  filter,
  sorting,
  onSortingChange,
}: LibraryViewProps & {
  filter: string
  sorting: SortingState
  onSortingChange: (sorting: SortingState) => void
}) {
  const isDesktop = useIsDesktop()
  const swipe = useSwipe("list")
  const showTable = isDesktop && layout === "table"

  // Typing and re-sorting fetch new pages; the deferred values keep the
  // current list on screen (dimmed) instead of falling back to a skeleton.
  const q = useDebounced(filter.trim(), 300)
  const live = useMemo(() => toPageQuery(sorting, q), [sorting, q])
  const query = useDeferredValue(live)
  const stale = query !== live
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSuspenseInfiniteQuery(libraryPagesQuery(type, query))
  const entries = useMemo(
    () => data.pages.flatMap((page) => page.items),
    [data.pages]
  )
  const total = data.pages[0]?.total ?? 0

  const table = useTable({
    features,
    columns,
    data: entries,
    state: { sorting },
    onSortingChange: (updater) =>
      onSortingChange(
        typeof updater === "function" ? updater(sorting) : updater
      ),
    getRowId: (row) => `${row.type}-${row.id}`,
  })
  const rows = table.getRowModel().rows
  const loadMore = useCallback(() => {
    if (!isFetchingNextPage) void fetchNextPage()
  }, [fetchNextPage, isFetchingNextPage])
  const kind = KINDS[type]
  const hasStatus = type === "game" || type === "book"
  const one = kind.label.toLowerCase()
  const noun = kind.plural.toLowerCase()
  const Icon = kind.icon

  if (!total && !query.q) {
    return (
      <Empty className="min-h-[50dvh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
          <EmptyTitle>No {noun} yet</EmptyTitle>
          <EmptyDescription>
            Search for something you've watched or played and log it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link
            to="/search"
            search={{ type, q: "" }}
            className={buttonVariants({ size: "lg" })}
          >
            <PlusIcon />
            Add {noun}
          </Link>
        </EmptyContent>
      </Empty>
    )
  }

  const currentSort = SORT_OPTIONS.find(
    (o) =>
      o.sorting[0].id === sorting[0]?.id &&
      o.sorting[0].desc === sorting[0].desc
  )

  return (
    <div className="space-y-4">
      <ListToolbar
        count={`${total.toLocaleString("en-US")} ${total === 1 ? one : noun}`}
        // The table sorts from its column headers.
        sort={
          showTable
            ? undefined
            : {
                items: SORT_OPTIONS.map(({ value, label }) => ({
                  value,
                  label,
                })),
                value: currentSort?.value ?? "recent",
                onChange: (value) => {
                  const option = SORT_OPTIONS.find((o) => o.value === value)
                  if (option) onSortingChange([...option.sorting])
                },
              }
        }
        view={
          <ViewSwitch
            // The table is a desktop view.
            options={
              isDesktop
                ? [
                    {
                      value: "grid" as const,
                      label: "Grid",
                      icon: <LayoutGridIcon className="size-4" />,
                    },
                    {
                      value: "table" as const,
                      label: "Table",
                      icon: <ListIcon className="size-4" />,
                    },
                  ]
                : []
            }
            value={layout}
            onChange={onLayoutChange}
            onSwipe={rows.length ? swipe.openDeck : undefined}
          />
        }
      />
      {/* Same filter and order as the grid; loads more pages as you go. */}
      <SwipeDeck
        open={swipe.open}
        items={entries}
        title={kind.plural}
        onClose={swipe.close}
        hasMore={hasNextPage}
        loadingMore={isFetchingNextPage}
        onNearEnd={() => void fetchNextPage()}
      />

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {noun} match “{filter}”.
        </p>
      ) : showTable ? (
        <div
          className={cn(
            "overflow-hidden rounded-xl border",
            stale && "opacity-60"
          )}
        >
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers
                    .filter((h) => hasStatus || h.column.id !== "status")
                    .map((header) => {
                      const sorted = header.column.getIsSorted()
                      return (
                        <TableHead key={header.id}>
                          {header.column.getCanSort() ? (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <table.FlexRender header={header} />
                              {sorted === "asc" ? (
                                <ArrowUpIcon className="size-3.5" />
                              ) : null}
                              {sorted === "desc" ? (
                                <ArrowDownIcon className="size-3.5" />
                              ) : null}
                            </button>
                          ) : (
                            <table.FlexRender header={header} />
                          )}
                        </TableHead>
                      )
                    })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  {row
                    .getAllCells()
                    .filter((c) => hasStatus || c.column.id !== "status")
                    .map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(cell.column.id === "title" && "max-w-80")}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <MediaGrid className={cn(stale && "opacity-60")}>
          {rows.map((row) => {
            const entry = row.original
            const status = statusLabel(entry.status)
            return (
              // Skip rendering offscreen cards in large libraries.
              <div
                key={row.id}
                className="[contain-intrinsic-size:auto_18rem] [content-visibility:auto]"
              >
                <MediaCard
                  media={entry}
                  meta={
                    <>
                      {entry.rating !== undefined ? (
                        <StarRating
                          rating={entry.rating}
                          className="text-[0.6875rem]"
                        />
                      ) : null}
                      {status && !entry.rating ? <span>{status}</span> : null}
                    </>
                  }
                />
              </div>
            )
          })}
        </MediaGrid>
      )}
      <LoadMore
        active={hasNextPage}
        loading={isFetchingNextPage}
        onVisible={loadMore}
      />
    </div>
  )
}

/** The table's sort state as a page query. */
function toPageQuery(sorting: SortingState, q: string): LibraryPageQuery {
  const first = sorting[0]
  const sort = LIBRARY_SORTS.find((s) => s === first?.id) ?? "lastLoggedAt"
  return { sort, desc: first?.desc ?? true, q }
}

/** `value`, once it has stopped changing for `ms`. */
function useDebounced<T>(value: T, ms: number) {
  const [settled, setSettled] = useState(value)
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(value), ms)
    return () => window.clearTimeout(timer)
  }, [value, ms])
  return settled
}
