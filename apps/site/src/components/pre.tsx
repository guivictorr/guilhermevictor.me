'use client';
import { PropsWithChildren } from 'react';

export function Pre({ children }: PropsWithChildren) {
  async function copy() {
    await navigator.clipboard.writeText(String(children));
  }
  return (
    <pre className='relative overflow-hidden'>
      <div className='overflow-y-auto'>{children}</div>
      <button
        type='button'
        onClick={copy}
        className='absolute top-2 right-2 px-2 py-1 text-xs text-secondary border rounded-md bg-background'
      >
        Copy
      </button>
    </pre>
  );
}
