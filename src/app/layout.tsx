import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from 'next/font/google';

import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';
import { Vignette } from '@/components/vignette';

import '@/styles/globals.css';
import { buildSEO } from '@/seo/seo';
import { Noise } from '@/components/noise';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description:
    'My personal space of an empathetic front-end developer building web experiences with passion',
  dynamic_og: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' className={`${playfair.variable} ${GeistSans.variable}`}>
      <body className='bg-background text-secondary scroll-smooth'>
        <Noise />
        <Vignette />
        <Analytics />

        <div className='flex flex-col justify-between items-center h-screen md:pt-32 pt-16'>
          <div className='md:max-w-6xl px-6 sm:px-8 w-full flex-1'>
            {children}
          </div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
