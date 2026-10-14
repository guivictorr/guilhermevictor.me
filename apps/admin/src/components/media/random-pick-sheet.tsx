import type { BacklogItem } from "@workspace/schemas"
import { Button, buttonVariants } from "@workspace/ui/components/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { ShuffleIcon } from "lucide-react"
import { useState } from "react"
import { MediaLink } from "@/components/media-card"
import { Poster } from "@/components/poster"
import { useIsDesktop } from "@/hooks/use-media-query"
import { formatDate } from "@/lib/format"

const pickRandom = <T,>(items: Array<T>) =>
  items[Math.floor(Math.random() * items.length)]

/** "Surprise me": picks from a pool and opens the sheet; rerolls stay in the pool. */
export function useRandomPick() {
  const [pool, setPool] = useState<Array<BacklogItem> | null>(null)
  const [pick, setPick] = useState<BacklogItem | undefined>()
  return {
    surprise: (items: Array<BacklogItem>) => {
      setPool(items)
      setPick(pickRandom(items))
    },
    sheetProps: {
      pick,
      open: pool !== null,
      onOpenChange: (open: boolean) => {
        if (!open) setPool(null)
      },
      onReroll: () => {
        if (pool) setPick(pickRandom(pool))
      },
      canReroll: (pool?.length ?? 0) > 1,
    },
  }
}

export function RandomPickSheet({
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
