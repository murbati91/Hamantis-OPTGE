/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // One Piece TCG palette — Straw Hat red on dark slate.
        // (Token kept named `mantis` so existing classNames keep working.)
        mantis: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Straw-hat gold accent.
        straw: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        ink: {
          850: '#111827',
          900: '#0f172a',
          950: '#0b1220',
        },
        // OP card color identities.
        op: {
          red: '#dc2626',
          green: '#16a34a',
          blue: '#2563eb',
          purple: '#7c3aed',
          black: '#374151',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
