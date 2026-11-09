import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group"
import { cn } from "@workspace/ui/lib/utils"

/** iOS-style segmented control: exactly one option is always selected. */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  label,
  className,
}: {
  value: T
  onValueChange: (value: T) => void
  options: ReadonlyArray<{ value: T; label: string }>
  label: string
  className?: string
}) {
  return (
    <ToggleGroup
      aria-label={label}
      spacing={0}
      value={[value]}
      onValueChange={(values) => {
        const next = values.at(-1) as T | undefined
        if (next && next !== value) onValueChange(next)
      }}
      className={cn(
        "grid w-full auto-cols-fr grid-flow-col rounded-lg bg-muted p-0.5",
        className
      )}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          className="h-8 w-full rounded-md text-[0.8125rem] font-medium text-muted-foreground transition-[background-color,color,box-shadow] duration-200 ease-(--ease-out) hover:bg-transparent data-pressed:bg-background data-pressed:text-foreground data-pressed:shadow-sm"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
