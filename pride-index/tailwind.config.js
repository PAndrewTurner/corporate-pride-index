/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0c0f',
          900: '#101218',
          850: '#14171f',
          800: '#1a1e28',
          700: '#252a37',
          600: '#3a4153',
          400: '#6b7387',
          300: '#9aa1b3',
          200: '#c3c8d4',
          100: '#e8eaf0'
        },
        band: {
          champion: '#10b981',
          ally: '#84cc16',
          neutral: '#eab308',
          performative: '#f97316',
          harmful: '#ef4444',
          adversarial: '#991b1b'
        }
      },
      fontFamily: {
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
