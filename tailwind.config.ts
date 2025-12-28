import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        aave: {
          primary: '#B6509E',
          dark: '#0F1419',
          light: '#F5F6F8',
        },
      },
    },
  },
  plugins: [],
};

export default config;
