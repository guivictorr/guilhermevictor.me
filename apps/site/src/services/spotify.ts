const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;
const recentTrackEndpoint = `${process.env.SPOTIFY_API_URL}/me/player/recently-played?limit=1`;
const tokenEndpoint = `${process.env.SPOTIFY_ACCOUNTS_URL}/token`;

type SpotifyArtist = {
  name: string;
  external_urls: {
    spotify: string;
  };
  images: {
    url: string;
    height: number;
    width: number;
  }[];
};

type SpotifySong = {
  played_at: string;
  track: {
    id: string;
    name: string;
    preview_url: string;
    external_urls: {
      spotify: string;
    };
    artists: SpotifyArtist[];
  };
};

type RecentlyPlayedTracksResponse = {
  items: SpotifySong[];
};

const getAccessToken = async () => {
  if (!refreshToken) return null;

  const basic = btoa(`${clientId}:${clientSecret}`);
  const query = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const options: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    next: {
      revalidate: 3400,
    },
    body: query.toString(),
  };

  const response = await fetch(tokenEndpoint, options);

  return response.json();
};

export const getLatestPlayedTrack = async () => {
  const { access_token } = await getAccessToken();

  const options: RequestInit = {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
    next: {
      revalidate: 30,
    },
  };

  const response = await fetch(recentTrackEndpoint, options);

  if (response.ok) {
    const { items } = (await response.json()) as RecentlyPlayedTracksResponse;

    return items[0];
  } else {
    const { error } = await response.json();
    throw new Error(error.message);
  }
};
