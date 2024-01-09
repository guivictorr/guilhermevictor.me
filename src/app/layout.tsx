import type { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from 'next/font/google';

import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';
import { Vignette } from '@/components/vignette';

import '@/styles/globals.css';
import { buildSEO } from '@/utils/buildSEO';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description:
    'My personal space of an empathetic front-end developer building web experiences with passion',
  imageUrl: 'https://github.com/guivictorr.png',
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' className={`${playfair.variable} ${GeistSans.variable}`}>
      <body className='bg-background text-secondary scroll-smooth'>
        {/* TODO: Maybe there's a better way to do this */}
        {/* <Grain /> */}

        <Vignette />
        <Analytics />

        <div className='flex flex-col gap-12 justify-between h-screen'>
          <div className='md:max-w-6xl mx-auto px-6 sm:px-8'>{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
