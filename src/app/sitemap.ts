import { getCrafts, getPosts } from '@/services/content';

export default async function sitemap() {
  const writing = getPosts().map(post => `/writing/${post.slug}`);
  const crafting = getCrafts().map(craft => `/crafts/${craft.slug}`);
  const routes = [
    '',
    '/writing',
    '/about',
    '/crafts',
    ...writing,
    ...crafting,
  ].map(route => ({
    url: `https://guilhermevictor.me${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }));

  return routes;
}
