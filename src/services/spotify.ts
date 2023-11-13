const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
const recentTrackEndpoint = `${process.env.SPOTIFY_API_URL}/me/player/recently-played?limit=1`;
const tokenEndpoint = `${process.env.SPOTIFY_ACCOUNTS_URL}/token`;

const getAccessToken = async () => {
  if (!refreshToken) return null;

  const basic = btoa(`${clientId}:${clientSecret}`);
  const query = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: query.toString(),
  });

  console.log(await response.json());

  return response.json();
};

export const getLatestPlayedTrack = async () => {
  const { access_token } = await getAccessToken();

  const response = await fetch(recentTrackEndpoint, {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    next: {
      revalidate: 30,
    },
  });

  console.log(await response.json());

  if (response.ok) {
    const { items } = await response.json();

    return {
      name: items[0].track.name,
      artist: items[0].track.artists[0].name,
      playedAt: items[0].played_at,
    };
  } else {
    const { error } = await response.json();
    throw new Error(error.message);
  }
};
