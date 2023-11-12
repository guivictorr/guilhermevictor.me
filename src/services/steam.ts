const steamUserId = process.env.STEAM_USER_ID as string;
const steamApiKey = process.env.STEAM_API_KEY as string;
const steamRecentlyPlayedGames = `${process.env.STEAM_API_URL}/IPlayerService/GetRecentlyPlayedGames/v0001`;

const TWENTY_FOUR_HOURS_IN_SECONDS = 86400;

export const getLatestPlayedGame = async () => {
  const options = {
    method: 'GET',
    next: {
      revalidate: TWENTY_FOUR_HOURS_IN_SECONDS,
    },
  };

  const query = new URLSearchParams({
    key: steamApiKey,
    steamid: steamUserId,
    count: '1',
  });
  const url = `${steamRecentlyPlayedGames}?${query.toString()}`;

  const response = await fetch(url, options);

  if (response.ok) {
    const {
      response: { games },
    } = await response.json();

    return games[0];
  } else {
    throw new Error('Error trying to fetch recently played games');
  }
};
