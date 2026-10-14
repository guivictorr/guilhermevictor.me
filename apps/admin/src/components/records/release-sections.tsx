import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { Credit, Release } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, PlayIcon } from "lucide-react"
import { useState } from "react"
import { DetailSection } from "@/components/detail-layout"
import { ScrollRow } from "@/components/media/media-rail"
import { YouTubeVideo } from "@/components/media/youtube"
import { Poster } from "@/components/poster"
import { ResponsiveSheet } from "@/components/responsive-sheet"
import { joinDefined } from "@/lib/format"
import { indexQuery, mediaKey } from "@/queries/archive"
import { masterQuery } from "@/queries/media"

/*
 * Release page sections: the notes read as a description above the
 * tracklist; credits, companies and identifiers are reference material, so
 * they sit at the bottom in one horizontally scrolling row.
 */

function CreditLine({ credit }: { credit: Credit }) {
  return (
    <>
      <span className="text-muted-foreground">
        {credit.role}
        {credit.tracks ? ` [${credit.tracks}]` : ""} –{" "}
      </span>
      {credit.names.join(", ")}
    </>
  )
}

export function Tracklist({ release }: { release: Release }) {
  if (!release.tracklist.length)
    return <p className="text-sm text-muted-foreground">No tracklist.</p>

  return (
    <DetailSection title="Tracklist">
      <ol className="overflow-hidden rounded-xl border bg-card">
        {release.tracklist.map((track, i) =>
          track.kind === "heading" ? (
            <li
              key={i}
              className="border-b bg-muted/40 px-4 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase last:border-b-0"
            >
              {track.title}
            </li>
          ) : (
            <li
              key={i}
              className="flex gap-3 border-b px-4 py-2.5 last:border-b-0"
            >
              <span className="w-8 shrink-0 pt-px text-sm text-muted-foreground tabular-nums">
                {track.position}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm">
                  {track.artists.length ? (
                    <span className="text-muted-foreground">
                      {track.artists.join(", ")} –{" "}
                    </span>
                  ) : null}
                  {track.title}
                </p>
                {track.credits.length ? (
                  <ul className="mt-0.5 space-y-0.5 text-xs">
                    {track.credits.map((credit, j) => (
                      <li key={j}>
                        <CreditLine credit={credit} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {track.subTracks?.length ? (
                  <ul className="mt-1 space-y-0.5 border-l pl-3 text-xs text-muted-foreground">
                    {track.subTracks.map((sub, j) => (
                      <li key={j} className="flex gap-2">
                        <span className="tabular-nums">{sub.position}</span>
                        <span className="flex-1">{sub.title}</span>
                        {sub.duration ? (
                          <span className="tabular-nums">{sub.duration}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {track.duration ? (
                <span className="text-sm text-muted-foreground tabular-nums">
                  {track.duration}
                </span>
              ) : null}
            </li>
          )
        )}
      </ol>
    </DetailSection>
  )
}

const NOTES_PREVIEW = 360

/** Discogs notes as a plain description, collapsed when long. */
export function ReleaseNotes({ release }: { release: Release }) {
  const [expanded, setExpanded] = useState(false)
  if (!release.notes) return null
  const long = release.notes.length > NOTES_PREVIEW
  return (
    <div>
      <p
        className={cn(
          "text-[0.9375rem] leading-relaxed text-pretty break-words whitespace-pre-line",
          long && !expanded && "line-clamp-5"
        )}
      >
        {release.notes}
      </p>
      {long ? (
        <Button
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Less" : "More"}
        </Button>
      ) : null}
    </div>
  )
}

/** One card in the reference row; scrolls inside when it's long. */
function InfoCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="max-h-96 w-80 shrink-0 snap-start overflow-y-auto overscroll-contain rounded-xl border bg-card px-4 py-3 text-sm leading-relaxed md:w-96">
      <h3 className="mb-2 font-heading font-semibold">{title}</h3>
      {children}
    </div>
  )
}

/** Credits, companies and identifiers, side by side in a scrolling row. */
export function ReleaseReference({ release }: { release: Release }) {
  const { credits, companies, identifiers } = release
  if (!credits.length && !companies.length && !identifiers.length) return null
  return (
    <DetailSection title="Credits & details">
      <ScrollRow>
        {credits.length ? (
          <InfoCard title="Credits">
            <ul className="space-y-1">
              {credits.map((credit, i) => (
                <li key={i}>
                  <CreditLine credit={credit} />
                </li>
              ))}
            </ul>
          </InfoCard>
        ) : null}
        {companies.length ? (
          <InfoCard title="Companies, etc.">
            <ul className="space-y-1">
              {companies.map((c, i) => (
                <li key={i}>
                  <span className="text-muted-foreground">{c.role} – </span>
                  {c.name}
                  {c.catno ? (
                    <span className="text-muted-foreground"> – {c.catno}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          </InfoCard>
        ) : null}
        {identifiers.length ? (
          <InfoCard title="Barcode and other identifiers">
            <ul className="space-y-1">
              {identifiers.map((id, i) => (
                <li key={i} className="break-words">
                  <span className="text-muted-foreground">
                    {id.type}
                    {id.description ? ` (${id.description})` : ""}:{" "}
                  </span>
                  {/* Matrix etchings are compared character by character. */}
                  <span className="font-mono text-[0.8125rem]">{id.value}</span>
                </li>
              ))}
            </ul>
          </InfoCard>
        ) : null}
      </ScrollRow>
    </DetailSection>
  )
}

const VERSIONS_PREVIEW = 6

/** Every pressing of this album, with the current one and owned ones marked. */
export function OtherVersionsSection({ release }: { release: Release }) {
  const { data: master, isPending } = useQuery({
    ...masterQuery(release.masterId ?? 0),
    enabled: release.masterId !== undefined,
  })
  const { data: index } = useQuery(indexQuery())
  const [showAll, setShowAll] = useState(false)
  if (release.masterId === undefined) return null

  const versions = master?.versions ?? []
  const visible = showAll ? versions : versions.slice(0, VERSIONS_PREVIEW)

  return (
    <DetailSection
      title="Other Versions"
      action={
        master ? (
          <span className="text-sm text-muted-foreground tabular-nums">
            {master.totalVersions} total
          </span>
        ) : null
      }
    >
      {isPending ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <div className="space-y-2">
          <ul className="divide-y overflow-hidden rounded-xl border bg-card">
            {visible.map((v) => {
              const current = v.id === release.id
              const owned = index?.owned.has(
                mediaKey({ type: "record", id: v.id })
              )
              return (
                <li key={v.id}>
                  <Link
                    to="/records/$id"
                    params={{ id: String(v.id) }}
                    disabled={current}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 transition-colors",
                      current
                        ? "bg-muted/60"
                        : "hover:bg-muted/50 active:bg-muted"
                    )}
                  >
                    <Poster
                      image={v.thumb}
                      type="record"
                      title={v.title}
                      size="thumb"
                      className="w-11 shrink-0 rounded-md"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {v.title}
                        {v.format ? (
                          <span className="font-normal text-muted-foreground">
                            {" "}
                            ({v.format})
                          </span>
                        ) : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {joinDefined([
                          v.label && v.catno
                            ? `${v.label} – ${v.catno}`
                            : v.label,
                          v.country,
                          v.year,
                        ])}
                      </p>
                    </div>
                    {current ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        This one
                      </span>
                    ) : owned ? (
                      <span
                        aria-label="In your collection"
                        className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      >
                        <CheckIcon className="size-3.5" strokeWidth={3} />
                      </span>
                    ) : null}
                  </Link>
                </li>
              )
            })}
          </ul>
          {versions.length > VERSIONS_PREVIEW ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll
                ? "Show fewer"
                : `Show all ${versions.length}${
                    master && master.totalVersions > versions.length
                      ? ` of ${master.totalVersions}`
                      : ""
                  }`}
            </Button>
          ) : null}
        </div>
      )}
    </DetailSection>
  )
}

export function VideosSection({ release }: { release: Release }) {
  if (!release.videos.length) return null
  return (
    <DetailSection title={`Videos (${release.videos.length})`}>
      <ScrollRow>
        {release.videos.map((video) => (
          <YouTubeVideo
            key={video.key}
            video={video}
            className="w-72 shrink-0 snap-start md:w-80"
          />
        ))}
      </ScrollRow>
    </DetailSection>
  )
}

/** The master's first release year, when this pressing is a reissue. */
export function useOriginalYear(release: Release) {
  const { data: master } = useQuery({
    ...masterQuery(release.masterId ?? 0),
    enabled: release.masterId !== undefined,
  })
  const year = master?.year
  return year && release.year && year < release.year ? year : undefined
}

/** Round play button next to the title: plays the release's first video. */
export function PlayReleaseButton({ release }: { release: Release }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const video = release.videos[current]
  if (!release.videos.length) return null
  return (
    <>
      <Button
        size="icon-lg"
        className="pressable shrink-0 rounded-full"
        aria-label={`Play ${release.videos[0]?.name ?? "video"}`}
        onClick={() => {
          setCurrent(0)
          setOpen(true)
        }}
      >
        <PlayIcon className="ml-0.5" fill="currentColor" />
      </Button>
      <ResponsiveSheet
        open={open}
        onOpenChange={setOpen}
        title={release.title}
        description={video?.name}
        className="md:[--drawer-content-width:36rem]"
      >
        {/* Mounted only while open, so closing the sheet stops playback. */}
        {open && video ? (
          <div className="space-y-3">
            <div className="aspect-video overflow-hidden rounded-xl bg-black">
              <iframe
                key={video.key}
                src={`https://www.youtube-nocookie.com/embed/${video.key}?autoplay=1&playsinline=1&rel=0`}
                title={video.name}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="size-full"
              />
            </div>
            {release.videos.length > 1 ? (
              <ol className="divide-y rounded-xl border">
                {release.videos.map((v, i) => (
                  <li key={v.key}>
                    <button
                      type="button"
                      onClick={() => setCurrent(i)}
                      aria-current={i === current || undefined}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/50 aria-[current]:font-medium"
                    >
                      <span className="w-5 shrink-0 text-xs text-muted-foreground tabular-nums">
                        {i === current ? (
                          <PlayIcon className="size-3.5" fill="currentColor" />
                        ) : (
                          i + 1
                        )}
                      </span>
                      <span className="min-w-0 truncate">{v.name}</span>
                    </button>
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </ResponsiveSheet>
    </>
  )
}
