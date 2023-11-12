import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    colors: {
      primary: '#FFD6B0',
      secondary: '#FFD6B0BD',
      background: '#362318',
    },
    extend: {},
  },
  plugins: [],
};
export default config;
