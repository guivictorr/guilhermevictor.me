import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import { MediaType } from "@workspace/schemas"
import type { BacklogItem } from "@workspace/schemas"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { cn } from "@workspace/ui/lib/utils"
import { BookmarkIcon, ChevronRightIcon, DicesIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
} from "@/components/media-card"
import { ScrollRow } from "@/components/media/media-rail"
import {
  RandomPickSheet,
  useRandomPick,
} from "@/components/media/random-pick-sheet"
import { PageBody, PageHeader } from "@/components/page-header"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"
import {
  backlogQuery,
  useAddToBacklog,
  useRemoveFromBacklog,
} from "@/queries/archive"

export const Route = createFileRoute("/backlog")({
  /** One kind's full grid; without it, a row per kind. */
  validateSearch: z.object({ kind: MediaType.optional().catch(undefined) }),
  head: () => ({ meta: [{ title: "Backlog · Archive" }] }),
  component: BacklogPage,
})

/** How many covers a kind's row shows before "See all". */
const ROW_LIMIT = 12

const SECTIONS = KIND_ORDER.map((type) => ({
  type,
  title: type === "record" ? "Records (want list)" : KINDS[type].plural,
}))

function BacklogPage() {
  const { kind } = Route.useSearch()
  const { data: backlog, isPending } = useQuery(backlogQuery())
  const { surprise, sheetProps } = useRandomPick()
  const sections = SECTIONS.map((section) => ({
    ...section,
    items: backlog?.filter((b) => b.type === section.type) ?? [],
  })).filter((section) => section.items.length)
  const current = sections.find((section) => section.type === kind)

  return (
    <>
      <PageHeader title="Backlog" subtitle="Things to watch and play next." />
      <PageBody className="space-y-8">
        {isPending ? (
          <MediaGridSkeleton />
        ) : !backlog?.length ? (
          <Empty className="min-h-[50dvh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <BookmarkIcon />
              </EmptyMedia>
              <EmptyTitle>Your backlog is empty</EmptyTitle>
              <EmptyDescription>
                Tap “Backlog” on any movie, show or game to save it for later.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link to="/search" className={buttonVariants({ size: "lg" })}>
                Find something
              </Link>
            </EmptyContent>
          </Empty>
        ) : (
          <>
            {sections.length > 1 ? (
              <KindFilter
                active={current?.type}
                total={backlog.length}
                counts={sections.map((s) => [s.type, s.items.length] as const)}
              />
            ) : null}
            {current ? (
              <section>
                <SectionHeader
                  {...current}
                  onSurprise={() => surprise(current.items)}
                />
                <MediaGrid>
                  {current.items.map((item) => (
                    <BacklogCard key={`${item.type}-${item.id}`} item={item} />
                  ))}
                </MediaGrid>
              </section>
            ) : (
              sections.map((section) => (
                <section key={section.type}>
                  <SectionHeader
                    {...section}
                    onSurprise={() => surprise(section.items)}
                    seeAll={section.items.length > ROW_LIMIT}
                  />
                  <ScrollRow>
                    {section.items.slice(0, ROW_LIMIT).map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="w-28 shrink-0 snap-start md:w-32"
                      >
                        <BacklogCard item={item} />
                      </div>
                    ))}
                  </ScrollRow>
                </section>
              ))
            )}
          </>
        )}
      </PageBody>

      <RandomPickSheet {...sheetProps} />
    </>
  )
}

/** Same pills as the library's kind switcher, with how many are waiting. */
function KindFilter({
  active,
  total,
  counts,
}: {
  active?: MediaType
  total: number
  counts: Array<readonly [MediaType, number]>
}) {
  const pill = (selected: boolean) =>
    cn(
      "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors",
      selected
        ? "border-primary bg-primary text-primary-foreground"
        : "text-muted-foreground hover:text-foreground"
    )
  const count = (n: number) => (
    <span className="tabular-nums opacity-70">{n}</span>
  )
  return (
    <nav aria-label="Backlog kinds">
      <ScrollRow className="snap-none gap-2 pb-1">
        <Link
          to="/backlog"
          search={{}}
          aria-current={active ? undefined : "page"}
          className={pill(!active)}
        >
          All {count(total)}
        </Link>
        {counts.map(([type, n]) => {
          const { plural, icon: Icon } = KINDS[type]
          return (
            <Link
              key={type}
              to="/backlog"
              search={{ kind: type }}
              aria-current={active === type ? "page" : undefined}
              className={pill(active === type)}
            >
              <Icon className="size-4" />
              {plural} {count(n)}
            </Link>
          )
        })}
      </ScrollRow>
    </nav>
  )
}

function SectionHeader({
  type,
  title,
  items,
  onSurprise,
  seeAll = false,
}: {
  type: MediaType
  title: string
  items: Array<BacklogItem>
  onSurprise: () => void
  seeAll?: boolean
}) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 className="font-heading text-lg font-semibold">
        {title}{" "}
        <span className="font-normal text-muted-foreground tabular-nums">
          {items.length}
        </span>
      </h2>
      {items.length > 1 ? (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full"
          onClick={onSurprise}
        >
          <DicesIcon />
          Surprise me
        </Button>
      ) : null}
      {seeAll ? (
        <Link
          to="/backlog"
          search={{ kind: type }}
          className="ml-auto inline-flex shrink-0 items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          See all
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : null}
    </div>
  )
}

function BacklogCard({ item }: { item: BacklogItem }) {
  return <MediaCard media={item} badge={<RemoveButton item={item} />} />
}

function RemoveButton({ item }: { item: BacklogItem }) {
  const remove = useRemoveFromBacklog()
  const add = useAddToBacklog()
  return (
    <button
      type="button"
      aria-label={`Remove ${item.title} from backlog`}
      onClick={() =>
        remove.mutate(item, {
          onSuccess: () =>
            toast("Removed from backlog", {
              description: item.title,
              action: { label: "Undo", onClick: () => add.mutate(item) },
            }),
        })
      }
      className="pressable flex size-7 items-center justify-center rounded-full bg-background/70 shadow-md backdrop-blur-md"
    >
      <XIcon className="size-4" />
    </button>
  )
}
