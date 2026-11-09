import { getPosts } from '@/services/content';
import { baseUrl } from '@/constants';
import { routing } from '@/lib/next-intl';
import { MetadataRoute } from 'next';

const staticRoutes = ['', '/writing', '/records'];

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = routing.locales;
  const today = new Date().toISOString().split('T')[0];

  const allPosts = Object.fromEntries(
    locales.map(l => [l, getPosts({ locale: l })]),
  );

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.flatMap(route =>
    locales.map(locale => ({
      url: `${baseUrl}/${locale}${route}`,
      lastModified: today,
      alternates: {
        languages: Object.fromEntries(
          locales.map(l => [
            l === 'pt-br' ? 'pt-BR' : l,
            `${baseUrl}/${l}${route}`,
          ]),
        ),
      },
    })),
  );

  const postEntries: MetadataRoute.Sitemap = locales.flatMap(locale =>
    allPosts[locale].map(post => {
      const altLanguages = Object.fromEntries(
        locales
          .map(l => {
            const altPost = allPosts[l].find(p => p.slug === post.slug);
            const key = l === 'pt-br' ? 'pt-BR' : l;
            return altPost
              ? [key, `${baseUrl}/${l}/writing/${post.slug}`]
              : null;
          })
          .filter((e): e is [string, string] => e !== null),
      );

      return {
        url: `${baseUrl}/${locale}/writing/${post.slug}`,
        lastModified: post.metadata.publishedAt.toISOString().split('T')[0],
        alternates: {
          languages: altLanguages,
        },
      };
    }),
  );

  return [...staticEntries, ...postEntries];
}
