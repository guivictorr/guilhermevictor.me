const DISCOGS_USERNAME = process.env.DISCOGS_USERNAME;
const DISCOGS_SECRET = process.env.DISCOGS_SECRET;
const DISCOGS_KEY = process.env.DISCOGS_KEY;
const DISCOGS_API_URL = `https://api.discogs.com/users/${DISCOGS_USERNAME}/wants?per_page=100`;
const DISCOGS_COLLECTION_ENDPOINT = `https://api.discogs.com/users/${DISCOGS_USERNAME}/collection/folders/0/releases?per_page=100&sort=artist&sort_order=asc`;

export type DiscogsRelease = {
  id: number;
  basic_information: {
    cover_image: string;
    thumb: string;
    title: string;
    year: number;
    resource_url: string;
    artists: {
      name: string;
      id: number;
    }[];
  };
};

type DiscogsCollection = {
  releases: DiscogsRelease[];
};
export async function getDiscogsCollection(): Promise<DiscogsCollection> {
  const response = await fetch(DISCOGS_COLLECTION_ENDPOINT, {
    headers: {
      Authorization: `Discogs key=${DISCOGS_KEY}, secret=${DISCOGS_SECRET}`,
    },
    cache: 'force-cache',
    next: { revalidate: 60 },
  });
  const json = await response.json();

  return json;
}
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
