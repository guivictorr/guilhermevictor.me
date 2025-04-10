import { Icon } from '@/components/icon';
import Link from 'next/link';
import { PropsWithChildren } from 'react';

export default function ListsLayout({ children }: PropsWithChildren) {
  return (
    <div className='max-w-2xl mx-auto'>
      <nav>
        <Link
          href='/'
          className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
        >
          <Icon icon='back' />
          <span>Home</span>
        </Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
