'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect, useId } from 'react';
import { Icon } from './icon';

export function ThemeSwitcher() {
  const { theme, themes, setTheme } = useTheme();
  const id = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  function handleThemeToggle(theme: string, coords?: { x: number; y: number }) {
    const root = document.documentElement;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (!document.startViewTransition || prefersReducedMotion) {
      setTheme(theme);
      return;
    }

    if (coords) {
      root.style.setProperty('--x', `${coords.x}px`);
      root.style.setProperty('--y', `${coords.y}px`);
    }

    document.startViewTransition(() => {
      setTheme(theme);
    });
  }

  return (
    <fieldset className='flex items-center gap-8'>
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
              onChange={event => {
                const target = event.currentTarget;
                const rect = target.getBoundingClientRect();

                handleThemeToggle(t, {
                  x: rect.right,
                  y: rect.top,
                });
              }}
              checked={t === theme}
            />
          </span>
        ))}
    </fieldset>
  );
}
