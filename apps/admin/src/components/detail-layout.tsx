import { useQuery } from "@tanstack/react-query"
import { useCanGoBack, useNavigate, useRouter } from "@tanstack/react-router"
import type {
  ImageRef,
  MediaType,
  ProviderRating,
  WorkId,
} from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"
import { ChevronLeftIcon, StarIcon } from "lucide-react"
import { Poster } from "./poster"
import { imageUrl } from "@/lib/images"
import { KINDS } from "@/lib/media-kinds"
import { logsQuery } from "@/queries/archive"

/** Back that respects in-app history, falling back to a parent route on deep links. */
export function BackButton({
  fallback,
  className,
}: {
  fallback: string
  className?: string
}) {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const navigate = useNavigate()
  return (
    <Button
      variant="secondary"
      size="icon-lg"
      aria-label="Back"
      className={cn(
        "rounded-full border-border/60 bg-background/70 shadow-sm backdrop-blur-md",
        className
      )}
      onClick={() =>
        canGoBack ? router.history.back() : navigate({ to: fallback })
      }
    >
      <ChevronLeftIcon className="size-5" />
    </Button>
  )
}

export function DetailHero({
  type,
  title,
  poster,
  backdrop,
  eyebrow,
  tagline,
  meta,
  genres = [],
  ratings,
  actions,
  titleAction,
  backTo,
}: {
  type: MediaType
  title: string
  poster?: ImageRef
  backdrop?: ImageRef
  /** Defaults to a media type badge ("Movie"); seasons pass the show title. */
  eyebrow?: React.ReactNode
  tagline?: string
  meta?: React.ReactNode
  genres?: Array<string>
  ratings?: React.ReactNode
  actions?: React.ReactNode
  /** Sits right after the title, e.g. a record's play button. */
  titleAction?: React.ReactNode
  backTo: string
}) {
  const backdropUrl = imageUrl(backdrop ?? poster, "backdrop")

  return (
    <section className="relative">
      <div className="absolute inset-x-0 top-0 h-72 overflow-hidden md:h-96">
        {backdropUrl ? (
          <img
            src={backdropUrl}
            alt=""
            aria-hidden
            className={cn(
              "size-full object-cover",
              !backdrop && "scale-110 blur-2xl"
            )}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/70 to-background" />
      </div>

      <div className="pt-safe px-safe relative md:px-8">
        <div className="pt-3 md:pt-6">
          <BackButton fallback={backTo} />
        </div>
        <div className="mt-16 flex items-end gap-4 md:mt-28 md:gap-6">
          <Poster
            image={poster}
            type={type}
            title={title}
            size="large"
            priority
            vinyl={type === "record"}
            className={cn(
              "w-28 shrink-0 shadow-xl md:w-44",
              // Room for the record sliding out of its sleeve.
              type === "record" && "mr-10 md:mr-16"
            )}
          />
          <div className="min-w-0 pb-1">
            <div className="type-overline mb-2 text-signal-text">
              {eyebrow ?? KINDS[type].label}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="type-title text-[1.75rem] md:text-[2.5rem]">
                {title}
              </h1>
              {titleAction}
            </div>
            {tagline ? (
              <p className="mt-1 text-sm text-muted-foreground italic">
                {tagline}
              </p>
            ) : null}
            {meta ? (
              <div className="mt-1.5 text-sm text-muted-foreground">{meta}</div>
            ) : null}
          </div>
        </div>

        {genres.length || ratings ? (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2.5">
            {ratings}
            {genres.length ? (
              <ul className="flex flex-wrap gap-1.5" aria-label="Genres">
                {genres.map((genre) => (
                  <li key={genre}>
                    <Badge variant="outline">{genre}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {actions ? (
          <div className="mt-5 flex gap-2 *:flex-1 md:*:flex-none md:*:px-6">
            {actions}
          </div>
        ) : null}
      </div>
    </section>
  )
}

const SOURCE_LABEL: Record<ProviderRating["source"], string> = {
  tmdb: "TMDB",
  igdb: "IGDB",
  discogs: "Discogs",
  googlebooks: "Google",
}

function RatingChip({
  value,
  label,
  title,
  highlight = false,
}: {
  value: number
  label: string
  title: string
  highlight?: boolean
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 text-sm tabular-nums"
    >
      <StarIcon
        className={cn(
          "size-4",
          highlight ? "text-star" : "text-muted-foreground"
        )}
        fill="currentColor"
        strokeWidth={0}
      />
      <span className="font-semibold">{value.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground uppercase">{label}</span>
    </span>
  )
}

/** "★ 4.2 TMDB · ★ 4.5 MINE": the provider score next to your latest rating. */
export function RatingsRow({
  provider,
  type,
  id,
}: {
  provider?: ProviderRating
  type: MediaType
  id: WorkId
}) {
  const { data: logs } = useQuery(logsQuery({ type, id }))
  const mine = logs?.find((log) => log.rating !== undefined)?.rating

  if (!provider && mine === undefined) return null
  return (
    <div className="flex items-center gap-3">
      {provider ? (
        <RatingChip
          value={provider.value}
          label={SOURCE_LABEL[provider.source]}
          title={
            provider.count
              ? `${provider.count.toLocaleString()} ratings on ${SOURCE_LABEL[provider.source]}`
              : SOURCE_LABEL[provider.source]
          }
        />
      ) : null}
      {mine !== undefined ? (
        <RatingChip
          value={mine / 2}
          label="Mine"
          title="Your latest rating"
          highlight
        />
      ) : null}
    </div>
  )
}

export type DetailTab = {
  value: string
  label: React.ReactNode
  content: React.ReactNode
}

/**
 * Tabs + sidebar. Desktop: two columns. Mobile: the sidebar follows the
 * tab content so details stay reachable from any tab.
 */
export function DetailBody({
  tabs,
  aside,
}: {
  tabs: Array<DetailTab>
  aside: React.ReactNode
}) {
  return (
    <div className="px-safe mt-6 grid gap-8 md:px-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-10">
      <Tabs defaultValue={tabs[0]?.value} className="min-w-0 gap-5">
        <TabsList
          variant="line"
          className="w-full justify-start gap-5 border-b px-0 group-data-horizontal/tabs:h-11"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex-none px-0 text-[0.9375rem]"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value} className="space-y-8">
            {tab.content}
          </TabsContent>
        ))}
      </Tabs>
      <aside className="space-y-4">{aside}</aside>
    </div>
  )
}

export function DetailSection({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={className}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function SideCard({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </section>
  )
}

/** Label/value rows (director, country…), skipping empty values. */
export function FactList({
  facts,
}: {
  facts: Array<[string, string | number | undefined]>
}) {
  const visible = facts.filter(
    (f): f is [string, string | number] => f[1] !== undefined && f[1] !== ""
  )
  if (!visible.length) return null
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
      {visible.map(([label, value]) => (
        <div key={label} className="contents">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="min-w-0 text-right">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function DetailsCard({
  facts,
}: {
  facts: Array<[string, string | number | undefined]>
}) {
  return (
    <SideCard title="Details">
      <FactList facts={facts} />
    </SideCard>
  )
}

export function DetailSkeleton() {
  return (
    <div className="pt-safe px-safe md:px-8" aria-busy aria-label="Loading">
      <Skeleton className="mt-3 size-9 rounded-full md:mt-6" />
      <div className="mt-16 flex items-end gap-4 md:mt-28">
        <Skeleton className="aspect-[2/3] w-28 rounded-lg md:w-44" />
        <div className="flex-1 space-y-2 pb-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-lg md:w-40 md:flex-none" />
        <Skeleton className="h-11 flex-1 rounded-lg md:w-40 md:flex-none" />
      </div>
      <Skeleton className="mt-8 h-24 w-full rounded-xl" />
    </div>
  )
}
