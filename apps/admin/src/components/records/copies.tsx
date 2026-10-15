import type { CollectionItem, Release } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { PlusIcon } from "lucide-react"
import { formatDate, joinDefined } from "@/lib/format"
import { formatMoney } from "@/lib/grades"
import type { CollectionSnapshot } from "@/lib/repo"

/** The release fields a new copy is saved with. */
export function snapshotOf(release: Release): CollectionSnapshot {
  const label = release.labels[0]
  return {
    type: "record",
    releaseId: release.id,
    title: release.title,
    artist: release.artists.join(", "),
    year: release.year,
    format: release.format,
    label: label?.name,
    catno: label?.catno,
    genres: release.genres,
    styles: release.styles,
    cover: release.cover,
  }
}

/** Your copies as options for the record log form (plays are on a copy). */
export function copyOptions(copies: Array<CollectionItem>) {
  return copies.map((copy, i) => ({
    value: copy.id,
    label:
      joinDefined([
        copy.variant,
        copy.mediaCondition,
        formatDate(copy.acquiredAt),
      ]) || `Copy ${i + 1}`,
  }))
}

/** Your copies of a release (condition, price, store); tap one to edit. */
export function Copies({
  copies,
  onSelect,
  onAdd,
}: {
  copies: Array<CollectionItem>
  onSelect: (copy: CollectionItem) => void
  onAdd: () => void
}) {
  return (
    <div className="space-y-3">
      {copies.length ? (
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {copies.map((copy) => (
            <li key={copy.id}>
              <button
                type="button"
                onClick={() => onSelect(copy)}
                className="w-full px-4 py-3 text-left transition-colors hover:bg-muted/50 active:bg-muted"
              >
                <div className="flex flex-wrap items-center gap-2">
                  {copy.mediaCondition ? (
                    <Badge variant="secondary">
                      Media {copy.mediaCondition}
                    </Badge>
                  ) : null}
                  {copy.sleeveCondition ? (
                    <Badge variant="secondary">
                      Sleeve {copy.sleeveCondition}
                    </Badge>
                  ) : null}
                  {copy.discogsInstanceId !== undefined ? (
                    <Badge variant="outline">From Discogs</Badge>
                  ) : null}
                </div>
                <p className="mt-1.5 text-sm">
                  {joinDefined([
                    copy.variant,
                    copy.acquiredAt
                      ? `Acquired ${formatDate(copy.acquiredAt)}`
                      : `Added ${formatDate(copy.addedAt)}`,
                    formatMoney(copy.price),
                    copy.store,
                  ]) || "No details yet"}
                </p>
                {copy.notes ? (
                  <p className="mt-1 line-clamp-2 text-sm whitespace-pre-line text-muted-foreground">
                    {copy.notes}
                  </p>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          This pressing isn't in your collection.
        </p>
      )}
      <Button variant="outline" onClick={onAdd}>
        <PlusIcon />
        {copies.length ? "Add another copy" : "Add to collection"}
      </Button>
    </div>
  )
}
