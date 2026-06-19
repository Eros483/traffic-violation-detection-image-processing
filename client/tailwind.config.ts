import type { Config } from 'tailwindcss'

// Color + font tokens live in src/index.css (@theme inline) so they can be
// driven by runtime CSS variables for light/dark switching. This file only
// declares content sources.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
