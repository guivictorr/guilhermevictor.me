import { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif } from 'next/font/google';

import { Analytics } from '@vercel/analytics/react';

import '@/globals.css';
import { buildSEO } from '@/app/seo';
import { Scripts } from './scripts';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { setDefaultOptions } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

const serif = Instrument_Serif({
  variable: '--font-serif',
  weight: ['400'],
  subsets: ['latin'],
});
export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description: 'Meu lugar para experimentar e compartilhar conhecimento.',
  dynamic_og: false,
});

setDefaultOptions({
  locale: ptBR,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang='pt-br'
      className={`${serif.variable} ${GeistSans.variable} scroll-smooth scroll-pt-20`}
      suppressHydrationWarning
    >
      <head>
        <Scripts />
      </head>
      <body className='bg-background text-secondary scroll-smooth pb-24'>
        <ThemeProvider>
          <Analytics />
          <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-background border rounded-full'>
            <ThemeSwitcher />
          </div>

          {/* <div className='px-2 pb-12 md:px-6'>{children}</div> */}
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
