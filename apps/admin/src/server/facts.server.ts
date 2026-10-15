import { isNull } from "drizzle-orm"
import type { Fact } from "@/lib/facts"
import { getDb } from "./db/client.server"
import {
  bookLogs,
  books,
  gameLogs,
  games,
  movieLogs,
  movies,
  recordLogs,
  records,
  showLogs,
  shows,
} from "./db/schema"

/*
 * Facts for Home: small, surprising numbers drawn from the whole archive.
 * Each fact only appears when there's enough data for it to mean something
 * (e.g. a "favorite director" needs at least two films by them).
 */

const countBy = <T>(items: Array<T>, key: (item: T) => string | undefined) => {
  const counts = new Map<string, number>()
  for (const item of items) {
    const k = key(item)
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
}

const top = <T>(items: Array<T>, score: (item: T) => number) =>
  items.reduce<T | undefined>(
    (best, item) =>
      best === undefined || score(item) > score(best) ? item : best,
    undefined
  )

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`
const stars = (rating: number) => `${(rating / 2).toFixed(1)}★`
const fmt = (n: number) => Math.round(n).toLocaleString("en-US")
const yearOf = (date?: string | null) =>
  date ? Number(date.slice(0, 4)) : undefined

export async function computeFacts(): Promise<Array<Fact>> {
  const db = getDb()
  const [
    movieRows,
    movieLogRows,
    showRows,
    showLogRows,
    gameRows,
    gameLogRows,
    bookRows,
    bookLogRows,
    recordRows,
    recordLogRows,
  ] = await Promise.all([
    db
      .select({
        id: movies.id,
        title: movies.title,
        year: movies.year,
        runtime: movies.runtime,
        directors: movies.directors,
        poster: movies.poster,
      })
      .from(movies),
    db.select().from(movieLogs),
    db
      .select({ id: shows.id, title: shows.title, poster: shows.poster })
      .from(shows),
    db.select().from(showLogs),
    db
      .select({
        id: games.id,
        title: games.title,
        poster: games.poster,
        developers: games.developers,
      })
      .from(games),
    db.select().from(gameLogs),
    db
      .select({
        id: books.id,
        title: books.title,
        poster: books.poster,
        pages: books.pages,
        authors: books.authors,
      })
      .from(books),
    db.select().from(bookLogs),
    db.select().from(records).where(isNull(records.backlogAddedAt)),
    db.select().from(recordLogs),
  ])

  const facts: Array<Fact> = []
  const add = (fact: Fact) => facts.push(fact)

  // --- movies -----------------------------------------------------------------
  const movieById = new Map(movieRows.map((m) => [m.id, m]))
  const watched = movieRows.filter((m) =>
    movieLogRows.some((l) => l.movieId === m.id)
  )
  const minutes = movieLogRows.reduce(
    (sum, l) => sum + (movieById.get(l.movieId)?.runtime ?? 0),
    0
  )
  if (minutes >= 60)
    add({
      id: "movie-hours",
      kind: "movie",
      label: "Spent watching movies",
      value: fmt(minutes / 60),
      unit: "hours",
      detail: `${plural(movieLogRows.length, "watch")}, ${(minutes / 60 / 24).toFixed(1)} days`,
      numeric: true,
    })
  const rewatched = top(
    countBy(movieLogRows, (l) => String(l.movieId)),
    ([, n]) => n
  )
  if (rewatched && rewatched[1] >= 2) {
    const movie = movieById.get(Number(rewatched[0]))
    if (movie)
      add({
        id: "movie-rewatched",
        kind: "movie",
        label: "Most rewatched",
        value: movie.title,
        detail: plural(rewatched[1], "watch"),
        link: { type: "movie", id: movie.id },
        image: movie.poster ?? undefined,
      })
  }
  const ratedMovies = watched.flatMap((m) => {
    const ratings = movieLogRows.flatMap((l) =>
      l.movieId === m.id && l.rating !== null ? [l.rating] : []
    )
    return ratings.length
      ? [
          {
            movie: m,
            rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          },
        ]
      : []
  })
  if (ratedMovies.length >= 3) {
    const best = top(ratedMovies, (r) => r.rating)!
    const worst = top(ratedMovies, (r) => -r.rating)!
    add({
      id: "movie-best",
      kind: "movie",
      label: "Your favorite film",
      value: best.movie.title,
      detail: `Rated ${stars(best.rating)}`,
      link: { type: "movie", id: best.movie.id },
      image: best.movie.poster ?? undefined,
    })
    if (worst.rating < best.rating)
      add({
        id: "movie-worst",
        kind: "movie",
        label: "Least favorite film",
        value: worst.movie.title,
        detail: `Rated ${stars(worst.rating)}`,
        link: { type: "movie", id: worst.movie.id },
        image: worst.movie.poster ?? undefined,
      })
  }
  const director = countBy(
    watched.flatMap((m) => m.directors),
    (d) => d
  )[0]
  if (director && director[1] >= 2)
    add({
      id: "movie-director",
      kind: "movie",
      label: "Favorite director",
      value: director[0],
      detail: `${plural(director[1], "film")} watched`,
    })
  const oldest = top(
    watched.filter((m) => m.year),
    (m) => -(m.year ?? 0)
  )
  if (oldest?.year && watched.length >= 3)
    add({
      id: "movie-oldest",
      kind: "movie",
      label: "Oldest film you've seen",
      value: oldest.title,
      detail: String(oldest.year),
      link: { type: "movie", id: oldest.id },
      image: oldest.poster ?? undefined,
    })
  const longest = top(
    watched.filter((m) => m.runtime),
    (m) => m.runtime ?? 0
  )
  if (longest?.runtime && watched.length >= 3)
    add({
      id: "movie-longest",
      kind: "movie",
      label: "Longest sit",
      value: longest.title,
      detail: `${Math.floor(longest.runtime / 60)}h ${longest.runtime % 60}m`,
      link: { type: "movie", id: longest.id },
      image: longest.poster ?? undefined,
    })

  // --- shows ------------------------------------------------------------------
  const seasonLogs = showLogRows.filter((l) => l.seasonNumber !== null)
  if (seasonLogs.length >= 2)
    add({
      id: "show-seasons",
      kind: "show",
      label: "Seasons watched",
      value: String(seasonLogs.length),
      detail: `across ${plural(new Set(seasonLogs.map((l) => l.showId)).size, "show")}`,
      numeric: true,
    })
  const binge = countBy(seasonLogs, (l) => String(l.showId))[0]
  const bingeShow = binge && showRows.find((s) => s.id === Number(binge[0]))
  if (binge && binge[1] >= 2 && bingeShow)
    add({
      id: "show-binge",
      kind: "show",
      label: "Most seasons logged",
      value: bingeShow.title,
      detail: plural(binge[1], "season"),
      link: { type: "show", id: bingeShow.id },
      image: bingeShow.poster ?? undefined,
    })

  // --- games ------------------------------------------------------------------
  const gameById = new Map(gameRows.map((g) => [g.id, g]))
  const hours = gameLogRows.reduce((sum, l) => sum + (l.hoursPlayed ?? 0), 0)
  if (hours >= 1)
    add({
      id: "game-hours",
      kind: "game",
      label: "Hours played",
      value: fmt(hours),
      unit: "hours",
      detail: `${(hours / 24).toFixed(1)} days of your life`,
      numeric: true,
    })
  const replayed = countBy(gameLogRows, (l) => String(l.gameId))[0]
  const replayedGame = replayed && gameById.get(Number(replayed[0]))
  if (replayed && replayed[1] >= 2 && replayedGame)
    add({
      id: "game-replayed",
      kind: "game",
      label: "Most replayed game",
      value: replayedGame.title,
      detail: plural(replayed[1], "playthrough"),
      link: { type: "game", id: replayedGame.id },
      image: replayedGame.poster ?? undefined,
    })
  // Each game counts once, by its latest log.
  const latestGame = new Map<number, (typeof gameLogRows)[number]>()
  for (const l of [...gameLogRows].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  ))
    latestGame.set(l.gameId, l)
  const finished = [...latestGame.values()].filter(
    (l) => l.status === "finished" || l.status === "completed"
  ).length
  if (latestGame.size >= 3)
    add({
      id: "game-finish-rate",
      kind: "game",
      label: "Games you finish",
      value: `${Math.round((finished / latestGame.size) * 100)}%`,
      detail: `${finished} of ${latestGame.size} started`,
      numeric: true,
    })
  const platform = countBy(gameLogRows, (l) => l.platform ?? undefined)[0]
  if (platform && platform[1] >= 2)
    add({
      id: "game-platform",
      kind: "game",
      label: "Main platform",
      value: platform[0],
      detail: plural(platform[1], "game") + " played on it",
    })
  const studio = countBy(
    [...latestGame.keys()].flatMap((id) => gameById.get(id)?.developers ?? []),
    (d) => d
  )[0]
  if (studio && studio[1] >= 2)
    add({
      id: "game-studio",
      kind: "game",
      label: "Favorite studio",
      value: studio[0],
      detail: `${plural(studio[1], "game")} played`,
    })

  // --- books ------------------------------------------------------------------
  const bookById = new Map(bookRows.map((b) => [b.id, b]))
  const finishedBooks = [
    ...new Set(
      bookLogRows.filter((l) => l.status === "finished").map((l) => l.bookId)
    ),
  ].flatMap((id) => bookById.get(id) ?? [])
  const pages = finishedBooks.reduce((sum, b) => sum + (b.pages ?? 0), 0)
  if (pages > 0)
    add({
      id: "book-pages",
      kind: "book",
      label: "Pages read",
      value: fmt(pages),
      unit: "pages",
      detail: `in ${plural(finishedBooks.length, "book")}`,
      numeric: true,
    })
  const thickest = top(
    finishedBooks.filter((b) => b.pages),
    (b) => b.pages ?? 0
  )
  if (thickest?.pages && finishedBooks.length >= 2)
    add({
      id: "book-longest",
      kind: "book",
      label: "Thickest book finished",
      value: thickest.title,
      detail: `${fmt(thickest.pages)} pages`,
      link: { type: "book", id: thickest.id },
      image: thickest.poster ?? undefined,
    })
  const author = countBy(
    bookRows.flatMap((b) => b.authors),
    (a) => a
  )[0]
  if (author && author[1] >= 2)
    add({
      id: "book-author",
      kind: "book",
      label: "Most read author",
      value: author[0],
      detail: plural(author[1], "book"),
    })

  // --- records ----------------------------------------------------------------
  const currency = countBy(
    recordRows,
    (r) => r.priceCurrency ?? undefined
  )[0]?.[0]
  const priced = recordRows.filter(
    (r) => r.priceAmount !== null && r.priceCurrency === currency
  )
  if (currency && priced.length >= 2) {
    const total = priced.reduce((sum, r) => sum + (r.priceAmount ?? 0), 0)
    const money = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
    add({
      id: "record-value",
      kind: "record",
      label: "Spent on vinyl",
      value: money.format(total),
      detail: `${plural(priced.length, "copy")} with a price, ${money.format(total / priced.length)} each on average`,
      numeric: true,
    })
    const priciest = top(priced, (r) => r.priceAmount ?? 0)!
    add({
      id: "record-priciest",
      kind: "record",
      label: "Most expensive record",
      value: priciest.title,
      detail: `${money.format(priciest.priceAmount ?? 0)} · ${priciest.artist}`,
      link: { type: "record", id: priciest.releaseId },
      image: priciest.cover ?? undefined,
    })
  }
  const releaseOfCopy = new Map(recordRows.map((r) => [r.id, r]))
  const mostPlayed = countBy(recordLogRows, (l) =>
    releaseOfCopy.get(l.recordId) ? l.recordId : undefined
  )[0]
  const playedCopy = mostPlayed && releaseOfCopy.get(mostPlayed[0])
  if (mostPlayed && mostPlayed[1] >= 2 && playedCopy)
    add({
      id: "record-played",
      kind: "record",
      label: "Most played record",
      value: playedCopy.title,
      detail: `${plural(mostPlayed[1], "play")} · ${playedCopy.artist}`,
      link: { type: "record", id: playedCopy.releaseId },
      image: playedCopy.cover ?? undefined,
    })
  const oldestPressing = top(
    recordRows.filter((r) => r.year),
    (r) => -(r.year ?? 0)
  )
  if (oldestPressing?.year && recordRows.length >= 3)
    add({
      id: "record-oldest",
      kind: "record",
      label: "Oldest pressing you own",
      value: oldestPressing.title,
      detail: `${oldestPressing.year} · ${oldestPressing.artist}`,
      link: { type: "record", id: oldestPressing.releaseId },
    })
  const label = countBy(recordRows, (r) => r.label ?? undefined)[0]
  if (label && label[1] >= 3)
    add({
      id: "record-label",
      kind: "record",
      label: "Label you collect",
      value: label[0],
      detail: plural(label[1], "record"),
    })

  // --- across everything ------------------------------------------------------
  const ratedByKind = {
    movie: movieLogRows,
    show: showLogRows,
    game: gameLogRows,
    book: bookLogRows,
    record: recordLogRows,
  }
  const allRatings = Object.values(ratedByKind)
    .flat()
    .flatMap((l) => (l.rating === null ? [] : [l.rating]))
  if (allRatings.length >= 5)
    add({
      id: "all-average",
      kind: "all",
      label: "Your average rating",
      value: stars(allRatings.reduce((a, b) => a + b, 0) / allRatings.length),
      detail: `over ${plural(allRatings.length, "rating")}`,
      numeric: true,
    })
  const kindAverages = Object.entries(ratedByKind).flatMap(([kind, rows]) => {
    const ratings = rows.flatMap((l) => (l.rating === null ? [] : [l.rating]))
    return ratings.length >= 3
      ? [{ kind, avg: ratings.reduce((a, b) => a + b, 0) / ratings.length }]
      : []
  })
  if (kindAverages.length >= 2) {
    const harsh = top(kindAverages, (k) => -k.avg)!
    const names: Record<string, string> = {
      movie: "movies",
      show: "shows",
      game: "games",
      book: "books",
      record: "records",
    }
    add({
      id: "all-harshest",
      kind: "all",
      label: "Where you're harshest",
      value: names[harsh.kind] ?? harsh.kind,
      detail: `${stars(harsh.avg)} on average`,
    })
  }
  const dates = [
    ...movieLogRows.map((l) => l.watchedAt),
    ...showLogRows.map((l) => l.finishedAt ?? l.startedAt),
    ...gameLogRows.map((l) => l.finishedAt ?? l.startedAt),
    ...bookLogRows.map((l) => l.finishedAt ?? l.startedAt),
    ...recordLogRows.map((l) => l.playedAt),
  ].flatMap((d) => (d ? [d] : []))
  const busiest = countBy(dates, (d) => String(yearOf(d)))[0]
  if (busiest && busiest[1] >= 5)
    add({
      id: "all-busiest-year",
      kind: "all",
      label: "Busiest year",
      value: busiest[0],
      detail: plural(busiest[1], "thing") + " logged",
      numeric: true,
    })
  const last = dates.sort().at(-1)
  if (last) {
    const days = Math.max(
      0,
      Math.floor((Date.now() - Date.parse(`${last}T12:00:00Z`)) / 86_400_000)
    )
    add({
      id: "all-last",
      kind: "all",
      label: "Since your last log",
      value: String(days),
      unit: days === 1 ? "day" : "days",
      detail: days === 0 ? "You logged something today" : undefined,
      numeric: true,
    })
  }

  return facts
}
