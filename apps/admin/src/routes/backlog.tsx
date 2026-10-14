import { useQuery } from "@tanstack/react-query"
import { Link, createFileRoute } from "@tanstack/react-router"
import type { BacklogItem } from "@workspace/schemas"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { BookmarkIcon, DicesIcon, ShuffleIcon, XIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import {
  MediaCard,
  MediaGrid,
  MediaGridSkeleton,
  MediaLink,
} from "@/components/media-card"
import { PageBody, PageHeader } from "@/components/page-header"
import { Poster } from "@/components/poster"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatDate } from "@/lib/format"
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

const pickRandom = <T,>(items: Array<T>) =>
  items[Math.floor(Math.random() * items.length)]

function BacklogPage() {
  const { data: backlog, isPending } = useQuery(backlogQuery())
  const [pool, setPool] = useState<Array<BacklogItem> | null>(null)
  const [pick, setPick] = useState<BacklogItem | undefined>()

  function surprise(items: Array<BacklogItem>) {
    setPool(items)
    setPick(pickRandom(items))
  }

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

      <RandomPickSheet
        pick={pick}
        open={pool !== null}
        onOpenChange={(open) => !open && setPool(null)}
        onReroll={() => pool && setPick(pickRandom(pool))}
        canReroll={(pool?.length ?? 0) > 1}
      />
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

function RandomPickSheet({
  pick,
  open,
  onOpenChange,
  onReroll,
  canReroll,
}: {
  pick?: BacklogItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onReroll: () => void
  canReroll: boolean
}) {
  const isDesktop = useIsDesktop()
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent className="md:[--drawer-content-width:24rem]">
        <DrawerHeader className="md:pt-6">
          <DrawerTitle className="text-lg">How about this?</DrawerTitle>
          <DrawerDescription>
            A random pick from your backlog.
          </DrawerDescription>
        </DrawerHeader>
        {pick ? (
          <div className="flex flex-col items-center gap-4 px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
            {/* Key on the pick so each reroll gets a fresh entrance. */}
            <div
              key={`${pick.type}-${pick.id}`}
              className="flex flex-col items-center gap-3 transition-[opacity,transform] duration-200 ease-(--ease-out) starting:scale-95 starting:opacity-0"
            >
              <Poster
                image={pick.poster}
                type={pick.type}
                title={pick.title}
                size="large"
                className="w-40 shadow-xl"
              />
              <div className="text-center">
                <p className="font-heading text-lg font-semibold text-balance">
                  {pick.title}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[pick.year, `added ${formatDate(pick.addedAt)}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            </div>
            <div className="flex w-full gap-2">
              {canReroll ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="h-11 flex-1"
                  onClick={onReroll}
                >
                  <ShuffleIcon />
                  Another
                </Button>
              ) : null}
              <MediaLink
                media={pick}
                className={buttonVariants({
                  size: "lg",
                  className: "h-11 flex-1",
                })}
              >
                Let's go
              </MediaLink>
            </div>
          </div>
        ) : null}
      </DrawerContent>
    </Drawer>
  )
}
