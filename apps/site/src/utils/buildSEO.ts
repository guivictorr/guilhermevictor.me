import { Metadata } from 'next';

type BuildSEOParams = {
  title: string;
  description: string;
  imageUrl: string;
};

type BuildSEO = (props: BuildSEOParams) => Metadata;

export const buildSEO: BuildSEO = ({ title, description, imageUrl }) => ({
  metadataBase: new URL('https://guilhermevictor.space'),
  title,
  description,
  generator: 'Next.js',
  applicationName: 'Next.js',
  referrer: 'origin-when-cross-origin',
  authors: [{ name: 'Guilherme Victor' }],
  creator: 'Guilherme Victor',
  openGraph: {
    title,
    description,
    url: '/',
    siteName: 'Guilherme Victor',
    images: {
      url: imageUrl,
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
      url: imageUrl,
    },
  },
});
