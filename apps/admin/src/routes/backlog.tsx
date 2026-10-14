import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
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
import { BookmarkIcon, DicesIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
} from "@/components/media-card"
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
  head: () => ({ meta: [{ title: "Backlog · Archive" }] }),
  component: BacklogPage,
})

const SECTIONS = KIND_ORDER.map((type) => ({
  type,
  title: type === "record" ? "Records (want list)" : KINDS[type].plural,
}))

function BacklogPage() {
  const { data: backlog, isPending } = useQuery(backlogQuery())
  const { surprise, sheetProps } = useRandomPick()

  return (
    <>
      <PageHeader title="Backlog" subtitle="Things to watch and play next." />
      <PageBody className="space-y-10">
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
          SECTIONS.map(({ type, title }) => {
            const items = backlog.filter((b) => b.type === type)
            if (!items.length) return null
            return (
              <section key={type}>
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
                      onClick={() => surprise(items)}
                    >
                      <DicesIcon />
                      Surprise me
                    </Button>
                  ) : null}
                </div>
                <MediaGrid>
                  {items.map((item) => (
                    <MediaCard
                      key={`${item.type}-${item.id}`}
                      media={item}
                      badge={<RemoveButton item={item} />}
                    />
                  ))}
                </MediaGrid>
              </section>
            )
          })
        )}
      </PageBody>

      <RandomPickSheet {...sheetProps} />
    </>
  )
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
