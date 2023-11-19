import Link from 'next/link';
import { PiArrowUUpLeft } from 'react-icons/pi';
import { PropsWithChildren } from 'react';

type LayoutProps = PropsWithChildren & {
  backText?: string;
  backHref: string;
};

export default function Layout({
  children,
  backText = 'back',
  backHref,
}: LayoutProps) {
  return (
    <main className='py-14'>
      <div className='grid grid-cols-1 md:grid-cols-[max-content,1fr]'>
        <nav className='mb-8'>
          <Link
            href={backHref}
            className='sticky top-[56px] [&>svg]:w-3 [&>svg]:mt-0.5 italic flex items-center gap-1.5 font-medium text-primary w-fit'
          >
            <PiArrowUUpLeft />
            <span>{backText}</span>
          </Link>
        </nav>
        <section className='max-w-xl mx-auto'>{children}</section>
      </div>
    </main>
  );
}
