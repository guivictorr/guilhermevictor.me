import { Metadata } from 'next';
import { PropsWithChildren } from 'react';
import { GeistSans } from 'geist/font/sans';
import { Playfair_Display } from 'next/font/google';

import { Analytics } from '@vercel/analytics/react';
import { Vignette } from '@/components/vignette';

import '@/styles/globals.css';
import { buildSEO } from '@/seo/seo';
import { Noise } from '@/components/noise';
import { structuredData } from '@/seo/structured-data';
import Script from 'next/script';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair-display',
});
export const dynamic = 'force-static';
export const metadata: Metadata = buildSEO({
  title: 'Guilherme Victor',
  description: 'My place to experiment and write about web development',
  dynamic_og: false,
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' className={`${playfair.variable} ${GeistSans.variable}`}>
      <head>
        <Script type='text/javascript' strategy='afterInteractive'>
          {`

    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "p23rxyo4dc");
`}
        </Script>
        <Script
          id='STRUCTURED-DATA'
          key='structured-data'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      </head>
      <body className='bg-background text-secondary scroll-smooth'>
        <Noise />
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
