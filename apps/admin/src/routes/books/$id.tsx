import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import type { Book } from "@workspace/schemas"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import { ExternalLinkIcon, PlusIcon } from "lucide-react"
import {
  DetailBody,
  DetailHero,
  DetailSection,
  DetailSkeleton,
  DetailsCard,
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
import { formatDate, joinDefined } from "@/lib/format"
import { bookQuery, searchQuery } from "@/queries/media"

export const Route = createFileRoute("/books/$id")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(bookQuery(params.id)),
  head: ({ loaderData }) => ({
    meta: [{ title: loaderData ? `${loaderData.title} · Archive` : "Archive" }],
  }),
  pendingComponent: DetailSkeleton,
  component: BookPage,
})

const languageNames = new Intl.DisplayNames(["en"], { type: "language" })
function languageName(code?: string) {
  if (!code) return undefined
  try {
    return languageNames.of(code) ?? code
  } catch {
    return code
  }
}

/** "2005-06-14" → "Jun 14, 2005"; partial dates ("2005", "2005-06") as-is. */
const publishedLabel = (date?: string) =>
  date && date.length === 10 ? formatDate(date) : date

function BookPage() {
  const { id } = Route.useParams()
  const { data: book } = useSuspenseQuery(bookQuery(id))
  const sheet = useLogSheet()
  const authors = book.authors.join(", ")
  const item = {
    type: "book" as const,
    id: book.id,
    title: book.title,
    subtitle: authors,
    year: book.year,
    poster: book.cover,
    genres: book.categories.slice(0, 5),
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
        genres={book.categories.slice(0, 4)}
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
                <Categories book={book} />
                {firstAuthor ? (
                  <MoreByAuthor name={firstAuthor} currentId={book.id} />
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
            <DetailsCard
              facts={[
                ["Author", authors],
                ["Publisher", book.publisher],
                ["Published", publishedLabel(book.publishedDate)],
                ["Pages", book.pages],
                ["Language", languageName(book.language)],
                ["ISBN-13", book.isbn13],
                ["ISBN-10", book.isbn10],
              ]}
            />
            <GoogleBooksCard book={book} />
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

function Categories({ book }: { book: Book }) {
  if (!book.categories.length) return null
  return (
    <DetailSection title="Categories">
      <ul className="flex flex-wrap gap-1.5">
        {book.categories.map((c) => (
          <li key={c}>
            <Badge variant="outline">{c}</Badge>
          </li>
        ))}
      </ul>
    </DetailSection>
  )
}

/** Other books by the first author, from a Google Books author search. */
function MoreByAuthor({
  name,
  currentId,
}: {
  name: string
  currentId: string
}) {
  const { data } = useQuery(searchQuery("book", "", { author: name }))
  const books = (data ?? []).filter((b) => b.id !== currentId).slice(0, 20)
  if (!books.length) return null
  return (
    <DetailSection title={`More by ${name}`}>
      <MediaRail items={books} />
    </DetailSection>
  )
}

function GoogleBooksCard({ book }: { book: Book }) {
  if (!book.infoLink && !book.providerRating) return null
  return (
    <SideCard title="On Google Books">
      {book.providerRating ? (
        <p className="text-sm">
          {book.providerRating.value.toFixed(1)} / 5
          {book.providerRating.count ? (
            <span className="text-muted-foreground">
              {" "}
              · {book.providerRating.count.toLocaleString()} ratings
            </span>
          ) : null}
        </p>
      ) : null}
      {book.infoLink ? (
        <a
          href={book.infoLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-medium underline-offset-4 hover:underline"
        >
          Open on Google Books
          <ExternalLinkIcon className="size-3.5" />
        </a>
      ) : null}
    </SideCard>
  )
}
