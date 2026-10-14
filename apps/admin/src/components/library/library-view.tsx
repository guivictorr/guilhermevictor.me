import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import {
  createColumnHelper,
  createSortedRowModel,
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@workspace/ui/components/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  LayoutGridIcon,
  ListIcon,
  PlusIcon,
  SearchIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { GAME_STATUS_OPTIONS } from "@/lib/game-status"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
  MediaLink,
} from "@/components/media-card"
import { Poster } from "@/components/poster"
import { StarRating } from "@/components/star-rating"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatDate } from "@/lib/format"
import { KINDS } from "@/lib/media-kinds"
import type { LibraryEntry } from "@/lib/repo"
import { libraryQuery } from "@/queries/archive"

const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
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
      const status = GAME_STATUS_OPTIONS.find(
        (o) => o.value === info.getValue()
      )
      return status ? <Badge variant="secondary">{status.label}</Badge> : null
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

const EMPTY: Array<LibraryEntry> = []

export type LibraryLayout = "grid" | "table"

export function LibraryView({
  type,
  layout,
  onLayoutChange,
}: {
  type: MediaType
  layout: LibraryLayout
  onLayoutChange: (layout: LibraryLayout) => void
}) {
  const { data, isPending } = useQuery(libraryQuery(type))
  const [filter, setFilter] = useState("")
  const [sorting, setSorting] = useState<SortingState>([
    { id: "lastLoggedAt", desc: true },
  ])
  const isDesktop = useIsDesktop()
  const showTable = isDesktop && layout === "table"

  const filtered = useMemo(() => {
    const all = data ?? EMPTY
    const needle = filter.trim().toLocaleLowerCase()
    return needle
      ? all.filter((e) => e.title.toLocaleLowerCase().includes(needle))
      : all
  }, [data, filter])

  const table = useTable({
    features,
    columns,
    data: filtered,
    state: { sorting },
    onSortingChange: setSorting,
    getRowId: (row) => `${row.type}-${row.id}`,
  })
  const rows = table.getRowModel().rows
  const kind = KINDS[type]
  const one = kind.label.toLowerCase()
  const noun = kind.plural.toLowerCase()
  const Icon = kind.icon

  if (isPending) return <MediaGridSkeleton />

  if (!data?.length) {
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
      <div className="flex gap-2">
        <InputGroup className="h-10 flex-1 rounded-xl">
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            aria-label={`Filter ${noun}`}
            placeholder={`Filter ${data.length} ${data.length === 1 ? one : noun}`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </InputGroup>
        {!showTable ? (
          <Select
            items={SORT_OPTIONS.map(({ value, label }) => ({ value, label }))}
            value={currentSort?.value ?? null}
            onValueChange={(value) => {
              const option = SORT_OPTIONS.find((o) => o.value === value)
              if (option) setSorting([...option.sorting])
            }}
          >
            <SelectTrigger
              aria-label="Sort by"
              className="h-10! w-auto rounded-xl"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent align="end">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        <ToggleGroup
          aria-label="Layout"
          variant="outline"
          spacing={0}
          value={[layout]}
          onValueChange={(values) => {
            const next = values.at(-1) as LibraryLayout | undefined
            if (next) onLayoutChange(next)
          }}
          className="hidden md:flex"
        >
          <ToggleGroupItem value="grid" aria-label="Grid" className="size-10">
            <LayoutGridIcon />
          </ToggleGroupItem>
          <ToggleGroupItem value="table" aria-label="Table" className="size-10">
            <ListIcon />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {noun} match “{filter}”.
        </p>
      ) : showTable ? (
        <div className="overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="hover:bg-transparent">
                  {group.headers
                    .filter((h) => type === "game" || h.column.id !== "status")
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
                    .filter((c) => type === "game" || c.column.id !== "status")
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
        <MediaGrid>
          {rows.map((row) => {
            const entry = row.original
            const status = GAME_STATUS_OPTIONS.find(
              (o) => o.value === entry.status
            )
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
                      {status && !entry.rating ? (
                        <span>{status.label}</span>
                      ) : null}
                    </>
                  }
                />
              </div>
            )
          })}
        </MediaGrid>
      )}
    </div>
  )
}
