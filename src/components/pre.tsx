'use client';

import { PropsWithChildren, useId } from 'react';

export function Pre({ children }: PropsWithChildren) {
  const id = useId();
  async function copy() {
    const textToCopy = document.querySelector(`#${id} #raw`)?.textContent;
    if (!textToCopy) return;
    await navigator.clipboard.writeText(textToCopy);
  }

  return (
    <pre id={id} className='relative overflow-hidden'>
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
