import { baseUrl } from '@/constants';
import { getCrafts, getPosts } from '@/services/content';

export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Guilherme Victor',
  url: baseUrl,
  description: 'My place to experiment and write about web development',
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
  blogPost: getPosts().map(data => ({
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
      jobTitle: 'Software Developer',
      url: 'https://github.com/guivictorr.png',
    },
    url: `${baseUrl}${data.metadata.url}`,
  })),
  breadcrumb: [
    ...getCrafts().map(craft => ({
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
          name: 'Crafts',
          item: `${baseUrl}/crafts`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: craft.metadata.title,
          item: `${baseUrl}/crafts/${craft.slug}`,
        },
      ],
    })),
    ...getPosts().map(post => ({
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
          name: 'Writing',
          item: `${baseUrl}/writing`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.metadata.title,
          item: `${baseUrl}/writing/${post.slug}`,
        },
      ],
    })),
    {
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
          name: 'Bookmarks',
          item: `${baseUrl}/bookmarks`,
        },
      ],
    },
  ],
};
