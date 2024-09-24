const LASTFM_API_KEY = process.env.LASTFM_API_KEY;
const LASTFM_USERNAME = process.env.LASTFM_USERNAME;
const LASTFM_API_URL = `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${LASTFM_USERNAME}&api_key=${LASTFM_API_KEY}&format=json&limit=1`;

export type LastFMSong = {
  artist: string;
  song: string;
  url: string;
  date: string;
};

export async function getLatestPlayedTrack(): Promise<LastFMSong> {
  const response = await fetch(LASTFM_API_URL);
  const json = await response.json();
  const firstTrack = json.recenttracks.track[0];

  return {
    artist: firstTrack.artist['#text'],
    song: firstTrack.name,
    url: firstTrack.url,
    date: firstTrack.date.uts,
  };
}
