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
      <body className='bg-background text-secondary scroll-smooth pb-24'>
        <NextIntlClientProvider>
          <ThemeProvider>
            <Analytics />
            <NavigationMenu />
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
