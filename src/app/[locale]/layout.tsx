import { Metadata } from 'next';
import { ThemeProvider } from 'next-themes';
import { GeistSans } from 'geist/font/sans';
import { Instrument_Serif } from 'next/font/google';
import { hasLocale, NextIntlClientProvider } from 'next-intl';

import { Analytics } from '@vercel/analytics/react';

import '@/globals.css';
import { buildSEO } from '@/app/seo';
import { Scripts } from '../scripts';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { routing } from '@/lib/next-intl';
import { notFound } from 'next/navigation';

type RootLayoutProps = React.PropsWithChildren & {
  params: Promise<{ locale: string }>;
};

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

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  return (
    <html
      lang={locale}
      className={`${serif.variable} ${GeistSans.variable} scroll-smooth scroll-pt-20 snap-y snap-mandatory`}
      suppressHydrationWarning
    >
      <head>
        <Scripts />
      </head>
      <body className='bg-background text-secondary scroll-smooth pb-24'>
        <NextIntlClientProvider>
          <ThemeProvider>
            <Analytics />
            <div className='fixed bottom-8 left-1/2 -translate-x-1/2 z-20 bg-background border rounded-full'>
              <ThemeSwitcher />
            </div>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
