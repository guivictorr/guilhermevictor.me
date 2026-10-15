import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { CollectionItem, Release } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import { useState } from "react"
import {
  DetailBody,
  DetailHero,
  DetailSection,
  DetailSkeleton,
  DetailsCard,
  FactList,
  RatingsRow,
  SideCard,
} from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { BacklogButton } from "@/components/media/backlog-button"
import { LogsTabLabel } from "@/components/media/detail-sections"
import { ScrollRow } from "@/components/media/media-rail"
import { YourStatsCard } from "@/components/media/your-stats-card"
import { CopySheet } from "@/components/records/copy-sheet"
import {
  OtherVersionsSection,
  PlayReleaseButton,
  ReleaseNotes,
  ReleaseReferenceCards,
  Tracklist,
  VideosSection,
  useOriginalYear,
} from "@/components/records/release-sections"
import { formatDate, joinDefined } from "@/lib/format"
import { formatMoney } from "@/lib/grades"
import { imageUrl } from "@/lib/images"
import { parseId } from "@/lib/params"
import type { CollectionSnapshot } from "@/lib/repo"
import { collectionQuery } from "@/queries/archive"
import { releaseQuery } from "@/queries/media"

export const Route = createFileRoute("/records/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(releaseQuery(parseId(params.id))),
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.artists.join(", ")} – ${loaderData.title} · Archive`
          : "Archive",
      },
    ],
  }),
  pendingComponent: DetailSkeleton,
  component: RecordPage,
})

function snapshotOf(release: Release): CollectionSnapshot {
  const label = release.labels[0]
  return {
    type: "record",
    releaseId: release.id,
    title: release.title,
    artist: release.artists.join(", "),
    year: release.year,
    format: release.format,
    label: label?.name,
    catno: label?.catno,
    genres: release.genres,
    styles: release.styles,
    cover: release.cover,
  }
}

function RecordPage() {
  const { id } = Route.useParams()
  const { data: release } = useSuspenseQuery(releaseQuery(parseId(id)))
  const { data: collection } = useQuery(collectionQuery())
  const copies = (collection ?? []).filter((c) => c.releaseId === release.id)
  const logSheet = useLogSheet()
  const [copySheet, setCopySheet] = useState<{
    open: boolean
    editing?: CollectionItem
  }>({ open: false })

  const originalYear = useOriginalYear(release)
  const artist = release.artists.join(", ")
  const label = release.labels[0]
  const item = {
    type: "record" as const,
    id: release.id,
    title: release.title,
    subtitle: artist,
    year: release.year,
    poster: release.cover,
    genres: release.genres,
  }

  return (
    <article>
      <DetailHero
        type="record"
        title={release.title}
        poster={release.cover}
        backdrop={release.images.at(1)}
        backTo="/records"
        titleAction={<PlayReleaseButton release={release} />}
        meta={joinDefined([artist, release.year, label?.name])}
        genres={[...release.genres, ...release.styles].slice(0, 5)}
        ratings={
          <RatingsRow
            provider={release.providerRating}
            type="record"
            id={release.id}
          />
        }
        actions={
          <>
            {/* Plays are logged on a copy you own. */}
            {copies.length ? (
              <Button
                size="lg"
                className="h-11 text-base"
                onClick={logSheet.openNew}
              >
                <PlusIcon />
                Log play
              </Button>
            ) : null}
            <Button
              variant={copies.length ? "secondary" : "outline"}
              size="lg"
              className="h-11 text-base"
              onClick={() => setCopySheet({ open: true })}
            >
              {copies.length
                ? `Owned${copies.length > 1 ? ` ×${copies.length}` : ""}`
                : "Collect"}
            </Button>
            {/* The backlog doubles as a want list until you own it. */}
            {copies.length ? null : <BacklogButton item={item} />}
          </>
        }
      />

      <DetailBody
        tabs={[
          {
            value: "about",
            label: "About",
            content: (
              <>
                <ReleaseNotes release={release} />
                <Tracklist release={release} />
                <OtherVersionsSection release={release} />
                <VideosSection release={release} />
                {release.images.length > 1 ? (
                  <DetailSection title="Images">
                    <ScrollRow>
                      {release.images.map((img) => (
                        <img
                          key={img.path}
                          src={imageUrl(img, "large")}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="aspect-square w-48 shrink-0 snap-start rounded-lg bg-muted object-cover md:w-60"
                        />
                      ))}
                    </ScrollRow>
                  </DetailSection>
                ) : null}
              </>
            ),
          },
          {
            value: "copies",
            label: (
              <>
                My copies
                {copies.length ? (
                  <span className="rounded-full bg-muted px-1.5 text-xs text-muted-foreground tabular-nums">
                    {copies.length}
                  </span>
                ) : null}
              </>
            ),
            content: (
              <Copies
                copies={copies}
                onSelect={(copy) => setCopySheet({ open: true, editing: copy })}
                onAdd={() => setCopySheet({ open: true })}
              />
            ),
          },
          {
            value: "plays",
            label: <LogsTabLabel type="record" id={release.id} label="Plays" />,
            content: (
              <LogHistory
                type="record"
                id={release.id}
                onSelect={logSheet.openEdit}
                emptyLabel="You haven't logged a listen yet."
              />
            ),
          },
        ]}
        aside={
          <>
            <YourStatsCard type="record" id={release.id} />
            <DetailsCard
              facts={[
                ["Artist", artist],
                ["Label", label?.name],
                ["Catalog #", label?.catno],
                ["Format", release.format],
                ["Country", release.country],
                ["Released", formatDate(release.released) ?? release.released],
                ["Original release", originalYear],
                ["Series", release.series.join(", ")],
                ["Genres", release.genres.join(", ")],
                ["Styles", release.styles.join(", ")],
              ]}
            />
            <StatisticsCard release={release} />
            <ReleaseReferenceCards release={release} />
          </>
        }
      />

      <LogSheet
        open={logSheet.open}
        onOpenChange={logSheet.onOpenChange}
        editing={logSheet.editing}
        target={{
          kind: "record",
          item,
          copies: copies.map((copy, i) => ({
            value: copy.id,
            label:
              joinDefined([
                copy.variant,
                copy.mediaCondition,
                formatDate(copy.acquiredAt),
              ]) || `Copy ${i + 1}`,
          })),
        }}
      />
      <CopySheet
        open={copySheet.open}
        onOpenChange={(open) => setCopySheet((s) => ({ ...s, open }))}
        editing={copySheet.editing}
        snapshot={snapshotOf(release)}
      />
    </article>
  )
}

/** Discogs community numbers, like the "Statistics" box on discogs.com. */
function StatisticsCard({ release }: { release: Release }) {
  const rows: Array<[string, string | undefined]> = [
    ["Have", release.community?.have.toLocaleString()],
    ["Want", release.community?.want.toLocaleString()],
    [
      "Avg rating",
      release.providerRating
        ? `${release.providerRating.value.toFixed(2)} / 5`
        : undefined,
    ],
    ["Ratings", release.providerRating?.count?.toLocaleString()],
    ["For sale", release.forSale?.toLocaleString()],
    [
      "Lowest price",
      release.lowestPrice !== undefined
        ? formatMoney({ amount: release.lowestPrice, currency: "USD" })
        : undefined,
    ],
  ]
  return (
    <SideCard title="Statistics">
      <FactList facts={rows} />
      {release.discogsUrl ? (
        <a
          href={release.discogsUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          Open on Discogs
          <ExternalLinkIcon className="size-3.5" />
        </a>
      ) : null}
    </SideCard>
  )
}

function Copies({
  copies,
  onSelect,
  onAdd,
}: {
  copies: Array<CollectionItem>
  onSelect: (copy: CollectionItem) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-3">
      {copies.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {copies.map((copy) => (
            <li key={copy.id}>
              <button
                type="button"
                onClick={() => onSelect(copy)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {copy.mediaCondition ? (
                    <Badge variant="secondary">
                      Media {copy.mediaCondition}
                    </Badge>
                  ) : null}
                  {copy.sleeveCondition ? (
                    <Badge variant="secondary">
                      Sleeve {copy.sleeveCondition}
                    </Badge>
                  ) : null}
                  {copy.discogsInstanceId !== undefined ? (
                    <Badge variant="outline">From Discogs</Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm">
                  {joinDefined([
                    copy.variant,
                    copy.acquiredAt
                      ? `Acquired ${formatDate(copy.acquiredAt)}`
                      : `Added ${formatDate(copy.addedAt)}`,
                    formatMoney(copy.price),
                    copy.store,
                  ]) || "No details yet"}
                </p>
                {copy.notes ? (
                  <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                    {copy.notes}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          This pressing isn't in your collection.
        </p>
      )}
      <Button variant="outline" onClick={onAdd}>
        <PlusIcon />
        {copies.length ? "Add another copy" : "Add to collection"}
      </Button>
    </div>
  )
}
