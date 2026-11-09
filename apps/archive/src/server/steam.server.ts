import { getSteamEnv } from "./env.server"

export type SteamPlaytime = { appId: number; name: string; minutes: number }

/**
 * Games in your Steam library you've actually played, with total playtime.
 * Needs "Game details" set to public in your Steam privacy settings, or
 * Steam answers with an empty list.
 */
export async function fetchSteamPlaytime(): Promise<Array<SteamPlaytime>> {
  const { STEAM_API_KEY, STEAM_ID } = getSteamEnv()
  const url = new URL(
    "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/"
  )
  url.searchParams.set("key", STEAM_API_KEY)
  url.searchParams.set("steamid", STEAM_ID)
  url.searchParams.set("include_appinfo", "1")
  url.searchParams.set("include_played_free_games", "1")
  const res = await fetch(url, { headers: { Accept: "application/json" } })
  if (!res.ok) throw new Error(`Steam ${res.status}`)
  const { response } = (await res.json()) as {
    response: {
      games?: Array<{ appid: number; name?: string; playtime_forever: number }>
    }
  }
  if (!response.games)
    throw new Error(
      "Steam returned no games: set Profile → Privacy → Game details to Public"
    )
  return response.games
    .filter((g) => g.playtime_forever > 0)
    .map((g) => ({
      appId: g.appid,
      name: g.name ?? String(g.appid),
      minutes: g.playtime_forever,
    }))
}
