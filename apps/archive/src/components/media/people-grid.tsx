import type { Person } from "@workspace/schemas"
import { Button } from "@workspace/ui/components/button"
import { UserIcon } from "lucide-react"
import { useState } from "react"
import { imageUrl } from "@/lib/images"

/** Full casts run into the hundreds; show the top billed first. */
const PREVIEW = 24

export function PeopleGrid({ people }: { people: Array<Person> }) {
  const [showAll, setShowAll] = useState(false)
  if (!people.length)
    return <p className="text-sm text-muted-foreground">No information.</p>
  const visible = showAll ? people : people.slice(0, PREVIEW)
  return (
    <div className="flex flex-col items-start gap-3">
      <ul className="grid w-full grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((person, i) => {
          const photo = imageUrl(person.photo, "thumb")
          return (
            // Same person can appear twice (e.g. two characters).
            <li key={`${person.id}-${i}`} className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover"
                  />
                ) : (
                  <UserIcon className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{person.name}</p>
                {person.role ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {person.role}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ul>
      {people.length > PREVIEW ? (
        <Button variant="ghost" size="sm" onClick={() => setShowAll((s) => !s)}>
          {showAll ? "Show fewer" : `Show all ${people.length}`}
        </Button>
      ) : null}
    </div>
  )
}
