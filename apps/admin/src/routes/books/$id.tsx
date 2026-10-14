import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Book } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ExternalLinkIcon, PlusIcon, UserIcon } from "lucide-react"
import { useState } from "react"
import {
  DetailBody,
  DetailHero,
  DetailSection,
  DetailSkeleton,
  DetailsCard,
  FactList,
  RatingsRow,
  SideCard,
} from "@/components/detail-layout"
import { LogHistory } from "@/components/log/log-history"
import { LogSheet } from "@/components/log/log-sheet"
import { useLogSheet } from "@/components/log/use-log-sheet"
import { BacklogButton } from "@/components/media/backlog-button"
import { LogsTabLabel } from "@/components/media/detail-sections"
import { MediaRail } from "@/components/media/media-rail"
import { YourStatsCard } from "@/components/media/your-stats-card"
import { Poster } from "@/components/poster"
import { joinDefined } from "@/lib/format"
import { imageUrl } from "@/lib/images"
import { parseId } from "@/lib/params"
import { authorQuery, authorWorksQuery, bookQuery } from "@/queries/media"

export const Route = createFileRoute("/books/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(bookQuery(parseId(params.id))),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: BookPage,
})

function BookPage() {
  const { id } = Route.useParams()
  const { data: book } = useSuspenseQuery(bookQuery(parseId(id)))
  const sheet = useLogSheet()
  const authors = book.authors.map((a) => a.name).join(", ")
  const item = {
    type: "book" as const,
    id: book.id,
    title: book.title,
    subtitle: authors,
    year: book.year,
    poster: book.cover,
    genres: book.subjects.slice(0, 5),
  }
  const firstAuthor = book.authors.at(0)

  return (
    <article>
      <DetailHero
        type="book"
        title={book.title}
        poster={book.cover}
        backTo="/books"
        tagline={book.subtitle}
        meta={joinDefined([
          authors,
          book.year,
          book.pages ? `${book.pages} pages` : undefined,
        ])}
        genres={book.subjects.slice(0, 4)}
        ratings={
          <RatingsRow provider={book.providerRating} type="book" id={book.id} />
        }
        actions={
          <>
            <Button
              size="lg"
              className="h-11 text-base"
              onClick={sheet.openNew}
            >
              <PlusIcon />
              Log read
            </Button>
            <BacklogButton item={item} />
          </>
        }
      />

      <DetailBody
        tabs={[
          {
            value: "about",
            label: "About",
            content: (
              <>
                {book.description ? (
                  <DetailSection title="Description">
                    <p className="text-[0.9375rem] leading-relaxed text-pretty whitespace-pre-line">
                      {book.description}
                    </p>
                  </DetailSection>
                ) : null}
                <Subjects book={book} />
                <Editions book={book} />
                {firstAuthor ? (
                  <MoreByAuthor
                    authorKey={firstAuthor.key}
                    name={firstAuthor.name}
                    currentId={book.id}
                  />
                ) : null}
              </>
            ),
          },
          {
            value: "logs",
            label: <LogsTabLabel type="book" id={book.id} />,
            content: (
              <LogHistory
                type="book"
                id={book.id}
                onSelect={sheet.openEdit}
                emptyLabel="You haven't logged this book yet."
              />
            ),
          },
        ]}
        aside={
          <>
            <YourStatsCard type="book" id={book.id} />
            {firstAuthor ? <AuthorCard authorKey={firstAuthor.key} /> : null}
            <DetailsCard
              facts={[
                ["Author", authors],
                ["First published", book.year],
                ["Pages", book.pages],
                ["Languages", book.languages.slice(0, 4).join(", ")],
                ["Editions", book.editionCount],
              ]}
            />
            <OpenLibraryCard book={book} />
          </>
        }
      />

      <LogSheet
        open={sheet.open}
        onOpenChange={sheet.onOpenChange}
        editing={sheet.editing}
        target={{ kind: "book", item }}
      />
    </article>
  )
}

function Subjects({ book }: { book: Book }) {
  const groups = [
    ["Subjects", book.subjects],
    ["Places", book.places],
    ["Times", book.times],
  ] as const
  if (!groups.some(([, values]) => values.length)) return null
  return (
    <DetailSection title="Subjects">
      <div className="space-y-3">
        {groups.map(([label, values]) =>
          values.length ? (
            <div key={label}>
              <p className="mb-1.5 text-xs text-muted-foreground">{label}</p>
              <ul className="flex flex-wrap gap-1.5">
                {values.map((v) => (
                  <li key={v}>
                    <Badge variant="outline">{v}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null
        )}
      </div>
    </DetailSection>
  )
}

const EDITIONS_PREVIEW = 5

function Editions({ book }: { book: Book }) {
  const [showAll, setShowAll] = useState(false)
  if (!book.editions.length) return null
  const visible = showAll
    ? book.editions
    : book.editions.slice(0, EDITIONS_PREVIEW)
  return (
    <DetailSection
      title="Editions"
      action={
        <span className="text-sm text-muted-foreground tabular-nums">
          {book.editionCount} total
        </span>
      }
    >
      <div className="space-y-2">
        <ul className="divide-y overflow-hidden rounded-xl border bg-card">
          {visible.map((e) => (
            <li key={e.key} className="flex items-center gap-3 px-3 py-2.5">
              <Poster
                image={e.cover ?? book.cover}
                type="book"
                title={e.title}
                size="thumb"
                className="w-10 shrink-0 self-start rounded"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">
                  {joinDefined([
                    e.publisher,
                    e.publishDate,
                    e.language,
                    e.pages ? `${e.pages} pages` : undefined,
                    e.format,
                  ])}
                </p>
                {e.isbn ? (
                  <p className="font-mono text-xs text-muted-foreground">
                    ISBN {e.isbn}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        {book.editions.length > EDITIONS_PREVIEW ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAll((s) => !s)}
          >
            {showAll ? "Show fewer" : `Show all ${book.editions.length}`}
          </Button>
        ) : null}
      </div>
    </DetailSection>
  )
}

function MoreByAuthor({
  authorKey,
  name,
  currentId,
}: {
  authorKey: string
  name: string
  currentId: number
}) {
  const { data } = useQuery(authorWorksQuery(authorKey))
  const works = (data ?? []).filter((w) => w.id !== currentId)
  if (!works.length) return null
  return (
    <DetailSection title={`More by ${name}`}>
      <MediaRail items={works} />
    </DetailSection>
  )
}

function AuthorCard({ authorKey }: { authorKey: string }) {
  const { data: author } = useQuery(authorQuery(authorKey))
  const [expanded, setExpanded] = useState(false)
  if (!author) return null
  const photo = imageUrl(author.photo, "poster")
  const lifespan = [author.birthDate, author.deathDate]
    .filter(Boolean)
    .join(" – ")

  return (
    <SideCard title="Author">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
          {photo ? (
            <img
              src={photo}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            <UserIcon className="size-5 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium">{author.name}</p>
          {lifespan ? (
            <p className="text-xs text-muted-foreground">{lifespan}</p>
          ) : null}
        </div>
      </div>
      {author.bio ? (
        <div className="mt-3 text-sm">
          <p className={expanded ? "whitespace-pre-line" : "line-clamp-4"}>
            {author.bio}
          </p>
          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className="mt-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        </div>
      ) : null}
    </SideCard>
  )
}

/** Open Library reading-log numbers, its equivalent of have/want. */
function OpenLibraryCard({ book }: { book: Book }) {
  return (
    <SideCard title="On Open Library">
      <FactList
        facts={[
          ["Want to read", book.shelves?.wantToRead.toLocaleString()],
          ["Reading", book.shelves?.reading.toLocaleString()],
          ["Read", book.shelves?.read.toLocaleString()],
          [
            "Avg rating",
            book.providerRating
              ? `${book.providerRating.value.toFixed(1)} / 5`
              : undefined,
          ],
          ["Ratings", book.providerRating?.count?.toLocaleString()],
        ]}
      />
      <a
        href={book.openLibraryUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
      >
        Open on Open Library
        <ExternalLinkIcon className="size-3.5" />
      </a>
    </SideCard>
  )
}
