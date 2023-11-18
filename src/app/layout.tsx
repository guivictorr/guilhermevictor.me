import type { Metadata } from 'next';
import { Playfair_Display } from 'next/font/google';
import '@/styles/globals.css';

const playfair = Playfair_Display({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Guilherme Victor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='bg-background text-secondary scroll-smooth'>
      <body className={playfair.className}>
        <div className='md:max-w-6xl mx-auto px-6 sm:px-8'>{children}</div>
      </body>
    </html>
  );
}
