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

const serif = Instrument_Serif({
  variable: '--font-serif',
  weight: ['400'],
  subsets: ['latin'],
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
      className={`${serif.variable} ${GeistSans.variable} scroll-smooth scroll-pt-20`}
      suppressHydrationWarning
    >
      <head>
        <Scripts />
      </head>
      <body className='bg-background text-secondary scroll-smooth'>
        <ThemeProvider>
          <Analytics />
          <Vignette />
          <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-background border rounded-full'>
            <ThemeSwitcher />
          </div>

          <div className='px-2 pb-12 md:px-6'>{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
