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
    <html lang='en' className='bg-background'>
      <body className={playfair.className}>
        <div className='md:max-w-3xl mx-auto px-4 h-[100dvh] text-secondary'>
          {children}
        </div>
      </body>
    </html>
  );
}
