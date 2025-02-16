'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect, useId } from 'react';
import { Icon } from './icon';

export function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme();
  const id = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <fieldset className='absolute top-8 right-8 z-20 flex items-center gap-8'>
      <legend className='sr-only'>Select a display theme:</legend>
      {mounted &&
        themes.map(t => (
          <span
            key={t}
            className='p-1 relative has-[:focus-visible]:ring-2 ring-primary rounded-sm'
          >
            <label htmlFor={`${id}_${t}`} className='cursor-pointer'>
              <span className='sr-only'>{t}</span>
              <Icon icon={t as 'system' | 'dark' | 'light'} />
              {t === theme && (
                <div className='absolute size-1 bg-primary rounded-full -bottom-1 left-1/2 -translate-x-1/2'></div>
              )}
            </label>
            <input
              type='radio'
              name='theme'
              id={`${id}_${t}`}
              value={t}
              className='sr-only'
              onChange={() => setTheme(t)}
              checked={t === theme}
            />
          </span>
        ))}
    </fieldset>
  );
}
