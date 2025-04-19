import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      primary: 'rgb(var(--color-primary))',
      secondary: 'rgb(var(--color-secondary))',
      background: 'rgb(var(--color-background))',
      lowcontrast: 'rgb(var(--color-low-contrast))',
      transparent: 'rgb(var(--color-transparent))',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        serif: ['var(--font-serif)'],
      },
      keyframes: {
        flash: {
          '0%': {
            opacity: '0',
            filter: 'blur(6px)',
            clipPath: 'circle(0% at center)',
          },
          '5%': {
            opacity: '0.8',
            clipPath: 'circle(30% at center)',
          },
          '20%': {
            opacity: '0.8',
            clipPath: 'circle(100% at center)',
          },
          '30%': {
            filter: 'blur(2px)',
          },
          '100%': {
            opacity: '0',
            filter: 'blur(0px)',
            clipPath: 'circle(100% at center)',
          },
        },
      },
      animation: {
        flash: 'flash 0.8s ease-out',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
