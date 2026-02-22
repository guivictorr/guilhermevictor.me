import { getPosts } from '@/services/content';
import { MetadataRoute } from 'next';
import { getLocale } from 'next-intl/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locale = await getLocale();
  const writing = getPosts({ locale }).map(post => `/writing/${post.slug}`);
  const routes = ['', ...writing].map(route => ({
    url: `https://guilhermevictor.me${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    priority: 1,
  }));

  return routes;
}
