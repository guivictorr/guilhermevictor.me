import { baseUrl } from '@/constants';
import { Metadata } from 'next';

export type BuildSEOParams = {
  title: string;
  description: string;
  url?: string;
  canonical?: string;
  locale?: string;
  dynamic_og?: boolean;
} & Omit<Metadata, 'alternates'>;

type BuildSEO = (props: BuildSEOParams) => Metadata;

export const buildSEO: BuildSEO = ({
  title,
  description,
  url,
  canonical = '/',
  locale = 'en',
  dynamic_og = true,
  ...rest
}) => {
  const ogLocale = locale === 'pt-br' ? 'pt_BR' : 'en_US';
  const altLocale = locale === 'pt-br' ? 'en_US' : 'pt_BR';
  const basePath = canonical === '/' ? '' : canonical;

  return {
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: `/${locale}${basePath}`,
      languages: {
        en: `/en${basePath}`,
        'pt-BR': `/pt-br${basePath}`,
        'x-default': `/en${basePath}`,
      },
    },
    title: {
      default: title,
      template: 'Guilherme Victor | %s',
    },
    description,
    applicationName: 'Guilherme Victor',
    authors: [{ name: 'Guilherme Victor' }],
    creator: 'Guilherme Victor',
    openGraph: {
      title,
      description,
      url,
      siteName: 'Guilherme Victor',
      images: {
        url: dynamic_og
          ? `/api/og?title=${title}&description=${description}`
          : '/default_og.png',
      },
      locale: ogLocale,
      alternateLocale: [altLocale],
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    twitter: {
      title,
      description,
      card: 'summary_large_image',
      creator: '@oguivictor',
      images: {
        url: dynamic_og
          ? `/api/og?title=${title}&description=${description}`
          : '/default_og.png',
      },
    },
    ...rest,
  };
};
