import { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif } from 'next/font/google';

import { Analytics } from '@vercel/analytics/react';
import { Vignette } from '@/components/vignette';

import '@/globals.css';
import { buildSEO } from '@/app/seo';
import { Scripts } from './scripts';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Noise } from '@/components/noise';

const serif = Instrument_Serif({
  variable: '--font-serif',
  weight: ['400'],
});
export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description: 'My place to experiment and write about web development',
  dynamic_og: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang='en'
      className={`${serif.variable} ${GeistSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <Scripts />
      </head>
      <body className='bg-background text-secondary scroll-smooth'>
        <ThemeProvider>
          <Analytics />
          <Vignette />
          <ThemeSwitcher />
          <Noise />

          <div className='flex flex-col justify-between items-center h-screen md:py-32 py-28'>
            <div className='md:max-w-6xl px-6 sm:px-8 w-full flex-1'>
              {children}
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
