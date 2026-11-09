import { cn } from "@workspace/ui/lib/utils"

/** Large expanded-uppercase title (design.md §4 "Display"); pads below the notch. */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}) {
  return (
    <header className={cn("pt-safe px-safe md:px-8", className)}>
      <div className="flex items-end justify-between gap-4 pt-6 pb-4 md:pt-10">
        <div className="min-w-0">
          <h1 className="type-display">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  )
}

export function PageBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-safe md:px-8", className)} {...props} />
}
