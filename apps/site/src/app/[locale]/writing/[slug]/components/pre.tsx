'use client';

import clsx from 'clsx';
import { PropsWithChildren, useEffect, useId, useState } from 'react';

export function Pre({ children }: PropsWithChildren) {
  const id = useId();
  const [copied, setCopied] = useState(false);

  function copy() {
    const textToCopy = document.querySelector(`#${id} #raw`)?.textContent;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(() => setCopied(true));
  }

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => {
      setCopied(false);
    }, 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [copied]);

  return (
    <pre id={id} className='relative overflow-hidden shadow-primary'>
      <div
        aria-hidden
        className={clsx(
          'opacity-0 bg-primary absolute inset-0 h-full w-full z-10 flex items-center justify-center',
          {
            'animate-flash': copied,
          },
        )}
      >
        <span className='text-background text-6xl font-serif'>Copied</span>
      </div>
      <div className='overflow-y-auto'>{children}</div>
      <button
        type='button'
        onClick={copy}
        className='absolute z-20 top-2 right-2 px-2 py-1 text-xs text-secondary border rounded-md bg-background cursor-pointer'
      >
        Copy
      </button>
    </pre>
  );
}
