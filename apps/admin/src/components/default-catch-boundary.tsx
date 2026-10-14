import { useRouter } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { Button } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { TriangleAlertIcon } from "lucide-react"

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  const router = useRouter()

  return (
    <div className="pt-safe px-safe">
      <Empty className="min-h-[60dvh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlertIcon />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription className="break-words">
            {error instanceof Error ? error.message : "Unknown error"}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            onClick={() => {
              reset()
              void router.invalidate()
            }}
          >
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
