import { baseUrl } from '@/constants';
import { getPosts } from '@/services/content';

export const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Guilherme Victor',
  url: baseUrl,
  description: 'My place to experiment and write about web development',
  publisher: {
    '@type': 'Person',
    name: 'Guilherme Victor',
    url: baseUrl,
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
    image: `${baseUrl}/api/og?title=${data.metadata.title}&description=${data.metadata.description}`,
    datePublished: data.metadata.publishedAt,
    author: {
      '@type': 'Person',
      name: 'Guilherme Victor',
      jobTitle: 'Software Developer',
      url: 'https://github.com/guivictorr.png',
    },
    publisher: {
      '@type': 'Person',
      name: 'Guilherme Victor',
      jobTitle: 'Software Developer',
      url: 'https://github.com/guivictorr.png',
    },
    url: `${baseUrl}${data.metadata.url}`,
  })),
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
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
        name: 'Writing',
        item: `${baseUrl}/writing`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: 'Bookmarks',
        item: `${baseUrl}/bookmarks`,
      },
    ],
  },
};
