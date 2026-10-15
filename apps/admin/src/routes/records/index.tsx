import { useMutation, useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { CollectionItem } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
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
import { Spinner } from "@workspace/ui/components/spinner"
import { Disc3Icon, DownloadCloudIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { LibraryNav } from "@/components/library/library-nav"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
} from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { collectionQuery, useImportCollection } from "@/queries/archive"
import { collectionValueQuery } from "@/queries/media"
import { importDiscogsCollection } from "@/server/media.functions"

export const Route = createFileRoute("/records/")({
  head: () => ({ meta: [{ title: "Records · Archive" }] }),
  component: RecordsPage,
})

const SORTS = {
  added: {
    label: "Recently added",
    compare: (a: Entry, b: Entry) => b.addedAt.localeCompare(a.addedAt),
  },
  artist: {
    label: "Artist",
    compare: (a: Entry, b: Entry) =>
      a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title),
  },
  title: {
    label: "Title",
    compare: (a: Entry, b: Entry) => a.title.localeCompare(b.title),
  },
  year: {
    label: "Year",
    compare: (a: Entry, b: Entry) => (b.year ?? 0) - (a.year ?? 0),
  },
} as const
type SortKey = keyof typeof SORTS

/** One card per release, even when you own several copies. */
type Entry = CollectionItem & { copies: number }

function groupByRelease(items: Array<CollectionItem>): Array<Entry> {
  const byRelease = new Map<number, Entry>()
  for (const item of items) {
    const existing = byRelease.get(item.releaseId)
    if (existing) existing.copies++
    else byRelease.set(item.releaseId, { ...item, copies: 1 })
  }
  return [...byRelease.values()]
}

function RecordsPage() {
  const { data: collection, isPending } = useQuery(collectionQuery())
  const [filter, setFilter] = useState("")
  const [sort, setSort] = useState<SortKey>("added")

  const entries = useMemo(() => {
    const needle = filter.trim().toLocaleLowerCase()
    return groupByRelease(collection ?? [])
      .filter(
        (e) =>
          !needle ||
          e.title.toLocaleLowerCase().includes(needle) ||
          e.artist.toLocaleLowerCase().includes(needle) ||
          e.label?.toLocaleLowerCase().includes(needle)
      )
      .sort(SORTS[sort].compare)
  }, [collection, filter, sort])

  const hasCollection = Boolean(collection?.length)

  return (
    <>
      <PageHeader
        title="Records"
        actions={hasCollection ? <ImportButton compact /> : null}
      />
      <PageBody className="space-y-4">
        <LibraryNav />
        {isPending ? (
          <MediaGridSkeleton />
        ) : !hasCollection ? (
          <Empty className="min-h-[50dvh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Disc3Icon />
              </EmptyMedia>
              <EmptyTitle>No records yet</EmptyTitle>
              <EmptyDescription>
                Import your Discogs collection once; after that it lives here.
                You can re-import anytime to pull in new additions.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <ImportButton />
            </EmptyContent>
          </Empty>
        ) : (
          <>
            <CollectionSummary items={collection ?? []} />
            <div className="flex gap-2">
              <InputGroup className="h-10 flex-1 rounded-xl">
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput
                  type="search"
                  aria-label="Filter records"
                  placeholder="Artist, title or label"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
              </InputGroup>
              <Select
                items={Object.entries(SORTS).map(([value, s]) => ({
                  value,
                  label: s.label,
                }))}
                value={sort}
                onValueChange={(value) => value && setSort(value)}
              >
                <SelectTrigger
                  aria-label="Sort by"
                  className="h-10! w-auto rounded-xl"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end">
                  {Object.entries(SORTS).map(([value, s]) => (
                    <SelectItem key={value} value={value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {entries.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No records match “{filter}”.
              </p>
            ) : (
              <MediaGrid>
                {entries.map((entry) => (
                  <div
                    key={entry.releaseId}
                    className="[contain-intrinsic-size:auto_14rem] [content-visibility:auto]"
                  >
                    <MediaCard
                      media={{
                        type: "record",
                        id: entry.releaseId,
                        title: entry.title,
                        subtitle: entry.artist,
                        year: entry.year,
                        poster: entry.cover,
                      }}
                      badge={
                        entry.copies > 1 ? (
                          <span className="rounded-full bg-background/80 px-2 py-0.5 text-xs font-semibold tabular-nums shadow-md backdrop-blur-md">
                            ×{entry.copies}
                          </span>
                        ) : null
                      }
                    />
                  </div>
                ))}
              </MediaGrid>
            )}
          </>
        )}
      </PageBody>
    </>
  )
}

function ImportButton({ compact = false }: { compact?: boolean }) {
  const importCollection = useImportCollection()
  const fetchCollection = useMutation({
    mutationFn: () => importDiscogsCollection(),
  })
  const pending = fetchCollection.isPending || importCollection.isPending

  async function run() {
    try {
      const { username, items } = await fetchCollection.mutateAsync()
      const result = await importCollection.mutateAsync(items)
      const copies = (n: number) => `${n} cop${n === 1 ? "y" : "ies"}`
      const changes = [
        result.added && `Imported ${copies(result.added)}`,
        result.linked && `Linked ${copies(result.linked)} you had`,
      ].filter(Boolean)
      toast.success(
        changes.length ? changes.join(" · ") : "Already up to date",
        {
          description: `From ${username}'s Discogs collection${
            result.skipped ? ` · ${result.skipped} already here` : ""
          }`,
        }
      )
    } catch (error) {
      toast.error("Import failed", {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  return (
    <Button
      variant={compact ? "outline" : "default"}
      size="lg"
      onClick={run}
      disabled={pending}
      aria-label={compact ? "Sync from Discogs" : undefined}
    >
      {pending ? <Spinner /> : <DownloadCloudIcon />}
      {compact ? (
        <span className="max-sm:sr-only">Sync Discogs</span>
      ) : (
        "Import from Discogs"
      )}
    </Button>
  )
}

function CollectionSummary({ items }: { items: Array<CollectionItem> }) {
  const value = useQuery(collectionValueQuery())
  const releases = new Set(items.map((i) => i.releaseId)).size
  const artists = new Set(items.map((i) => i.artist)).size

  // Sum what you paid per currency; mixing currencies would be meaningless.
  const paid = new Map<string, number>()
  for (const item of items)
    if (item.price)
      paid.set(
        item.price.currency,
        (paid.get(item.price.currency) ?? 0) + item.price.amount
      )
  const paidLabel = [...paid.entries()]
    .map(([currency, amount]) =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(amount)
    )
    .join(" + ")

  const tiles = [
    {
      label: "Records",
      value: releases.toLocaleString(),
      sub: items.length !== releases ? `${items.length} copies` : undefined,
    },
    { label: "Artists", value: artists.toLocaleString() },
    {
      label: "Discogs value",
      value: value.data?.median ?? (value.isPending ? "…" : "—"),
      sub: value.data
        ? `${value.data.minimum} – ${value.data.maximum}`
        : value.isError
          ? "Unavailable"
          : undefined,
    },
    ...(paidLabel
      ? [{ label: "You paid", value: paidLabel, sub: undefined }]
      : []),
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {tiles.map((tile) => (
        <div key={tile.label} className="min-w-0 rounded-xl border bg-card p-3">
          <div className="text-xs text-muted-foreground">{tile.label}</div>
          <div className="mt-0.5 truncate text-xl font-semibold tabular-nums">
            {tile.value}
          </div>
          {tile.sub ? (
            <div className="truncate text-xs text-muted-foreground tabular-nums">
              {tile.sub}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  )
}
