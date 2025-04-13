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
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
