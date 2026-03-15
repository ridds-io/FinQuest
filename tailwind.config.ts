import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        body: ['Outfit', 'sans-serif'],
      },
      colors: {
        gold: '#FFD700',
        'gold-dark': '#CC9900',
        'green-dark': '#2E7D32',
        'panel-border': 'rgba(255,215,0,0.35)',
      },
    },
  },
  plugins: [],
};
export default config;
