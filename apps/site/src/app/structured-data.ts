import { baseUrl } from '@/constants';
import { getPosts } from '@/services/content';
import { getTranslations } from 'next-intl/server';

export const structuredData = (
  t: Awaited<ReturnType<typeof getTranslations>>,
  locale: string,
) => ({
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Guilherme Victor',
  url: baseUrl,
  description: t('description'),
  publisher: {
    '@type': 'Person',
    name: 'Guilherme Victor',
    url: 'https://linkedin.com/in/guilhermeviictor',
    image: {
      '@type': 'ImageObject',
      url: 'https://github.com/guivictorr.png',
      width: 460,
      height: 460,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': baseUrl,
  },
  blogPost: getPosts({ locale }).map(data => ({
    '@type': 'BlogPosting',
    headline: data.metadata.title,
    description: data.metadata.description,
    image: `${baseUrl}/api/og?${new URLSearchParams({
      title: data.metadata.title,
      description: data.metadata.description,
    }).toString()}`,
    datePublished: data.metadata.publishedAt,
    dateModified: new Date().toISOString(),
    keywords: data.metadata.keywords,
    articleBody: data.metadata.description,
    author: {
      '@type': 'Person',
      name: 'Guilherme Victor',
      jobTitle: t('job-title'),
      url: 'https://github.com/guivictorr.png',
    },
    url: `${baseUrl}${data.metadata.url}`,
  })),
  breadcrumb: [
    ...getPosts({ locale }).map(post => ({
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Guilherme Victor',
          item: baseUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: post.metadata.title,
          item: `${baseUrl}/writing/${post.slug}`,
        },
      ],
    })),
  ],
});
