import { getPosts } from '@/services/content';
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const writing = getPosts().map(post => `/writing/${post.slug}`);
  const routes = ['', ...writing].map(route => ({
    url: `https://guilhermevictor.me${route}`,
    lastModified: new Date().toISOString().split('T')[0],
    priority: 1,
  }));

  return routes;
}
