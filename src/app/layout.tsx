import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from 'next/font/google';

import { Analytics } from '@vercel/analytics/react';
import { Vignette } from '@/components/vignette';

import '@/styles/globals.css';
import { buildSEO } from '@/seo/seo';
import { Scripts } from './scripts';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});
export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description: 'My place to experiment and write about web development',
  dynamic_og: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' className={`${playfair.variable} ${GeistSans.variable}`}>
      <head>
        <Scripts />
      </head>
      <body className='bg-background text-secondary scroll-smooth'>
        <Vignette />
        <Analytics />

        <div className='flex flex-col justify-between items-center h-screen md:py-32 py-16'>
          <div className='md:max-w-6xl px-6 sm:px-8 w-full flex-1'>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
