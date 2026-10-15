import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import type { Credit, Release } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import { cn } from "@workspace/ui/lib/utils"
import { CheckIcon, PlayIcon } from "lucide-react"
import { useState } from "react"
import { DetailSection, SideCard } from "@/components/detail-layout"
import { ScrollRow } from "@/components/media/media-rail"
import { YouTubeVideo } from "@/components/media/youtube"
import { Poster } from "@/components/poster"
import { joinDefined } from "@/lib/format"
import { indexQuery, mediaKey } from "@/queries/archive"
import { masterQuery } from "@/queries/media"

/*
 * Release page sections: the notes read as a description above the
 * tracklist; credits, companies and identifiers are reference material, so
 * they sit in the side column with the details and statistics.
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

/** Credits, companies and identifiers as side cards (record page aside). */
export function ReleaseReferenceCards({ release }: { release: Release }) {
  const { credits, companies, identifiers } = release
  return (
    <>
      {credits.length ? (
        <SideCard title="Credits">
          <ul className="space-y-1 text-sm leading-relaxed">
            {credits.map((credit, i) => (
              <li key={i}>
                <CreditLine credit={credit} />
              </li>
            ))}
          </ul>
        </SideCard>
      ) : null}
      {companies.length ? (
        <SideCard title="Companies, etc.">
          <ul className="space-y-1 text-sm leading-relaxed">
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
        </SideCard>
      ) : null}
      {identifiers.length ? (
        <SideCard title="Barcode and other identifiers">
          <ul className="space-y-1 text-sm leading-relaxed">
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
        </SideCard>
      ) : null}
    </>
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
        {release.videos.map((video, i) => (
          <YouTubeVideo
            key={video.key}
            id={i === 0 ? FIRST_VIDEO_ID : undefined}
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

const FIRST_VIDEO_ID = "release-first-video"

/**
 * Round play button next to the title: starts the first video in the Videos
 * section, right where it is on the page (switching to the About tab first
 * if needed).
 */
export function PlayReleaseButton({ release }: { release: Release }) {
  if (!release.videos.length) return null

  function play() {
    const start = () => {
      const player = document.getElementById(FIRST_VIDEO_ID)
      if (!player) return false
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
        .matches
      player.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "center",
      })
      player.querySelector("button")?.click()
      return true
    }
    if (start()) return
    // The videos live in the About tab; open it, then start once rendered.
    const about = [
      ...document.querySelectorAll<HTMLElement>('[role="tab"]'),
    ].find((tab) => tab.textContent.trim() === "About")
    about?.click()
    requestAnimationFrame(() => requestAnimationFrame(start))
  }

  return (
    <Button
      size="icon-lg"
      className="pressable shrink-0 rounded-full"
      aria-label={`Play ${release.videos[0]?.name ?? "video"}`}
      onClick={play}
    >
      <PlayIcon className="ml-0.5" fill="currentColor" />
    </Button>
  )
}
