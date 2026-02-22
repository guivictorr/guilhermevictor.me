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
import { getTranslations } from 'next-intl/server';
import { NavigationMenu } from '@/components/navigation-menu';

type RootLayoutProps = React.PropsWithChildren & {
  params: Promise<{ locale: string }>;
};

const serif = Instrument_Serif({
  variable: '--font-serif',
  weight: ['400'],
  subsets: ['latin'],
});

export async function generateMetadata({
  params,
}: RootLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'metadata' });
  return buildSEO({
    title: 'Guilherme Victor',
    description: t('description'),
    dynamic_og: false,
  });
}

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
      <body className='bg-background text-secondary scroll-smooth pb-28'>
        <NextIntlClientProvider>
          <ThemeProvider>
            <Analytics />
            <NavigationMenu />
            <GlobalFade />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

function GlobalFade() {
  return (
    <>
      <div
        className='bg-background backdrop-blur-xs fixed top-0 h-28 w-full z-10 pointer-events-none'
        style={{
          background: 'linear-gradient(to top, transparent, var(--background))',
          maskImage:
            'linear-gradient(to bottom, var(--background), 80% ,transparent)',
        }}
      ></div>
      <div
        className='bg-background backdrop-blur-xs fixed bottom-0 h-28 w-full z-10 pointer-events-none'
        style={{
          background:
            'linear-gradient(to bottom, transparent, var(--background))',
          maskImage:
            'linear-gradient(to top, var(--background), 80% ,transparent)',
        }}
      ></div>
    </>
  );
}
