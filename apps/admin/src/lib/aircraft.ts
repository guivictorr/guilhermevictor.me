/*
 * Aircraft photos are files the owner adds to `public/aircraft/`, named by
 * a slug of the aircraft name (see public/aircraft/README.md). A specific
 * variant falls back to its family: "Boeing 737 MAX 8" tries
 * boeing-737-max-8, boeing-737-max, then boeing-737.
 */

const slug = (name: string) =>
  name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export function aircraftImageCandidates(name?: string): Array<string> {
  if (!name?.trim()) return []
  const parts = slug(name).split("-")
  const candidates: Array<string> = []
  // Keep at least the maker and the model number ("boeing-737").
  for (let n = parts.length; n >= Math.min(2, parts.length); n--)
    candidates.push(`/aircraft/${parts.slice(0, n).join("-")}.webp`)
  return candidates
}
