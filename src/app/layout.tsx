import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';
import { Footer } from '@/components/footer';
import { Analytics } from '@vercel/analytics/react';
import { Grain } from '@/components/grain';
import { Vignette } from '@/components/vignette';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'Guilherme Victor',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className={`${playfair.variable} ${GeistSans.variable}`}>
      <body className='bg-background text-secondary scroll-smooth'>
        <Grain />
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
