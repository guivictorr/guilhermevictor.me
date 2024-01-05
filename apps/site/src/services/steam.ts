const steamUserId = process.env.STEAM_USER_ID;
const steamApiKey = process.env.STEAM_API_KEY;
const steamRecentlyPlayedGames = `${process.env.STEAM_API_URL}/IPlayerService/GetRecentlyPlayedGames/v0001`;

const ONE_HOUR = 3600;

type SteamGame = {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url: string;
  img_logo_url: string;
};

type RecentlyPlayedGamesResponse = {
  response: {
    total_count: number;
    games: SteamGame[];
  };
};

type GetLatestPlayedGamesParams = {
  count: number;
};

export const getLatestPlayedGames = async ({
  count,
}: GetLatestPlayedGamesParams) => {
  if (!steamUserId || !steamApiKey) return null;

  const options: RequestInit = {
    method: 'GET',
    next: {
      revalidate: ONE_HOUR,
    },
  };

  const query = new URLSearchParams({
    key: steamApiKey,
    steamid: steamUserId,
    count: String(count ?? 3),
  });
  const url = `${steamRecentlyPlayedGames}?${query.toString()}`;

  const response = await fetch(url, options);

  if (response.ok) {
    const result = (await response.json()) as RecentlyPlayedGamesResponse;
    const { games } = result.response;

    return games;
  } else {
    throw new Error('Error trying to fetch recently played games');
  }
};
