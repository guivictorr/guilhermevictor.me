import { Link } from "@tanstack/react-router"
import { buttonVariants } from "@workspace/ui/components/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"

export function NotFound() {
  return (
    <div className="pt-safe px-safe">
      <Empty className="min-h-[60dvh]">
        <EmptyHeader>
          <EmptyTitle>Not found</EmptyTitle>
          <EmptyDescription>This page or item doesn't exist.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Link to="/" className={buttonVariants()}>
            Go home
          </Link>
        </EmptyContent>
      </Empty>
    </div>
  )
}
