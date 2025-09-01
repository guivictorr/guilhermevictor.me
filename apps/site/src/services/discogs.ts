const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME;
const DISCOGS_SECRET = process.env.DISCOGS_SECRET;
const DISCOGS_KEY = process.env.DISCOGS_KEY;
const DISCOGS_API_URL = `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants?per_page=100`;

type DiscogsRelease = {
  id: number;
  basic_information: {
    cover_image: string;
    thumb: string;
    title: string;
    year: number;
    artists: {
      name: string;
      id: number;
    }[];
  };
};

type DiscogsWantList = {
  wants: DiscogsRelease[];
};

export async function getDiscogsWantList(): Promise<DiscogsWantList> {
  const response = await fetch(DISCOGS_API_URL, {
    headers: {
      Authorization: `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
    },
    cache: 'force-cache',
    next: { revalidate: 60 },
  });
  const json = await response.json();

  return json;
}
