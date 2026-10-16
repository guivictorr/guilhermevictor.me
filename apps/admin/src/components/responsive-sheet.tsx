import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@workspace/ui/components/drawer"
import { cn } from "@workspace/ui/lib/utils"
import { useState } from "react"
import { useIsDesktop } from "@/hooks/use-media-query"

/**
 * Bottom sheet on phones (swipe down to dismiss), side sheet on desktop:
 * the same Base UI drawer with a different swipe direction.
 */
export function ResponsiveSheet({
  open,
  onOpenChange,
  title,
  description,
  className,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** e.g. a desktop width override: "md:[--drawer-content-width:24rem]". */
  className?: string
  children: React.ReactNode
}) {
  const isDesktop = useIsDesktop()
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      swipeDirection={isDesktop ? "right" : "down"}
      showSwipeHandle={!isDesktop}
    >
      <DrawerContent
        className={cn("md:[--drawer-content-width:28rem]", className)}
      >
        <DrawerHeader className="pb-2 md:pt-6">
          <DrawerTitle className="text-lg">{title}</DrawerTitle>
          {description ? (
            <DrawerDescription className="truncate">
              {description}
            </DrawerDescription>
          ) : null}
        </DrawerHeader>
        {/* overflow-y-auto alone turns x into "auto": a few stray pixels
            would make the whole sheet scroll sideways on phones. */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

/**
 * Remounts sheet content each time the sheet opens (fresh form state)
 * without resetting it while the sheet animates closed.
 */
export function useOpenSession(open: boolean) {
  const [session, setSession] = useState(0)
  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) setSession((n) => n + 1)
  }
  return session
}
