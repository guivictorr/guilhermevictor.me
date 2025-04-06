'use client';
import { Icon } from '@/components/icon';
import { useRouter } from 'next/navigation';
import { PropsWithChildren } from 'react';

export default function ListsLayout({ children }: PropsWithChildren) {
  const router = useRouter();
  return (
    <div className='max-w-2xl mx-auto'>
      <nav>
        <button
          onClick={() => router.back()}
          className='no-underline [&>svg]:w-6 flex items-center gap-1.5 text-secondary w-fit font-serif italic'
        >
          <Icon icon='back' />
          <span>Back</span>
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
}
