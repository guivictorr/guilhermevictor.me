import { cn } from "@workspace/ui/lib/utils"

/** iOS-style large title header; pads itself below the notch. */
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
          <h1 className="truncate font-heading text-3xl font-bold tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
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
