'use client';
import { useTheme } from 'next-themes';
import { useState, useEffect, useId } from 'react';
import { Icon } from './icon';
import { motion } from 'motion/react';

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
    <fieldset className='flex items-center gap-2'>
      <legend className='sr-only'>Select a display theme:</legend>
      {mounted &&
        themes.map(t => (
          <span
            key={t}
            className='p-1 has-[:focus-visible]:ring-2 ring-primary rounded-sm'
          >
            <label
              htmlFor={`${id}_${t}`}
              className='relative cursor-pointer size-8 flex items-center justify-center'
            >
              <span className='sr-only'>{t}</span>
              <Icon icon={t as 'system' | 'dark' | 'light'} />
              {t === theme && (
                <motion.div
                  layoutId={id}
                  className='absolute rounded-full inset-0 mix-blend-difference bg-primary z-10'
                ></motion.div>
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
