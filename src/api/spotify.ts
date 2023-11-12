const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
  },
  body: 'grant_type=client_credentials',
};

export const getSpotifyAccessToken = async () => {
  const response = await fetch(
    'https://accounts.spotify.com/api/token',
    options,
  );

  if (response.ok) {
    const { access_token } = await response.json();
    return access_token;
  } else {
    throw new Error();
  }
};
