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
import { BookmarkIcon, ChevronRightIcon, DicesIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
} from "@/components/media-card"
import { KindFilter } from "@/components/kind-filter"
import { ScrollRow } from "@/components/media/media-rail"
import {
  RandomPickSheet,
  useRandomPick,
} from "@/components/media/random-pick-sheet"
import { PageBody, PageHeader } from "@/components/page-header"
import { SwipeButton } from "@/components/swipe/swipe-button"
import { SwipeDeck } from "@/components/swipe/swipe-deck"
import { swipeSearch, useSwipe } from "@/components/swipe/swipe-search"
import { KINDS, KIND_ORDER } from "@/lib/media-kinds"
import {
  backlogQuery,
  useAddToBacklog,
  useRemoveFromBacklog,
} from "@/queries/archive"

export const Route = createFileRoute("/backlog")({
  /** One kind's full grid; without it, a row per kind. */
  validateSearch: z
    .object({ kind: MediaType.optional().catch(undefined) })
    .extend(swipeSearch.shape),
  loader: ({ context }) =>
    void context.queryClient.prefetchQuery(backlogQuery()),
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
                to="/backlog"
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
  const swipe = useSwipe(type)
  return (
    <div className="mb-3 flex items-center gap-2">
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
          {/* Icon-only on phones, so the header fits with Swipe and See all. */}
          <span className="max-sm:sr-only">Surprise me</span>
        </Button>
      ) : null}
      <SwipeButton onClick={swipe.openDeck} />
      <SwipeDeck
        open={swipe.open}
        items={items}
        title={`${title} · Backlog`}
        onClose={swipe.close}
      />
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
