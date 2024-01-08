import Link from 'next/link';
import { PropsWithChildren } from 'react';
import { PiArrowUUpLeft } from 'react-icons/pi';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <main>
      <header className='py-8 sm:sticky top-0 z-50'>
        <nav>
          <Link
            href='/'
            className='font-serif no-underline [&>svg]:w-3 italic flex items-center gap-1.5 text-secondary w-fit'
          >
            <PiArrowUUpLeft />
            <span>back</span>
          </Link>
        </nav>
      </header>
      <div className='grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-0'>
        <section className='my-prose w-full mx-auto md:col-start-3 md:col-end-11'>
          {children}
        </section>
      </div>
    </main>
  );
}
