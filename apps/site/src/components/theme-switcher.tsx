'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { Icon } from './icon';

export function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <ul className='absolute top-8 right-8 z-20 flex flex-row-reverse items-center gap-8'>
      {mounted &&
        themes.map(t => (
          <li key={t} className='relative'>
            <button
              aria-label={`Theme ${t}`}
              className='capitalize'
              onClick={() => setTheme(t)}
            >
              <Icon icon={t as 'system' | 'dark' | 'light'} />
            </button>

            {t === theme && (
              <div className='absolute size-1 bg-primary rounded-full left-1/2 -translate-x-1/2'></div>
            )}
          </li>
        ))}
    </ul>
  );
}
