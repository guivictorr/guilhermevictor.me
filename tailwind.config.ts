import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      primary: '#FDDCBD',
      secondary: '#FDDCBDBD',
      background: '#180F0A',
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        serif: ['var(--font-playfair-display)'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
export default config;
