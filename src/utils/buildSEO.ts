import { Metadata } from 'next';

type BuildSEOParams = {
  title: string;
  description: string;
} & Metadata;

type BuildSEO = (props: BuildSEOParams) => Metadata;

export const buildSEO: BuildSEO = ({ title, description, ...rest }) => ({
  metadataBase: new URL('https://guilhermevictor.space'),
  title,
  description,
  generator: 'Next.js',
  applicationName: 'Guilherme Victor',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Guilherme Victor' }],
  creator: 'Guilherme Victor',
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Guilherme Victor',
    images: {
      url: `/api/og?title=${title}&description=${description}`,
    },
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
    creator: '@oguivictor',
    images: {
      url: '/',
    },
  },
  ...rest,
});
