import { Icon } from '@/components/icon';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className='h-full'>
      <Link
        href='/'
        className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
      >
        <Icon icon='back' />
        <span>Home</span>
      </Link>

      <section className='flex items-center justify-center flex-1 h-full'>
        <h1 className='font-serif text-3xl'>
          Someday I&apos;ll make a proper not found page...
        </h1>
      </section>
    </main>
  );
}
