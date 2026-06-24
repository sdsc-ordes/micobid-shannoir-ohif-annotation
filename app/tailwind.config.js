/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // brand accent — a single muted teal
        brand: {
          50:  '#F0FDFA',
          100: '#CCFBF1',
          500: '#14B8A6',
          600: '#0D9488',
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
        },
        // status palette — desaturated, conventional
        status: {
          todo:     '#94A3B8',
          progress: '#2563EB',
          submit:   '#D97706',
          revise:   '#DC2626',
          accept:   '#059669',
        },
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        riseIn:    { '0%': { opacity: '0', transform: 'translateY(4px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', maxHeight: '0' }, '100%': { opacity: '1', maxHeight: '600px' } },
      },
      animation: {
        fadeIn:    'fadeIn 0.15s ease-out both',
        riseIn:    'riseIn 0.18s ease-out both',
        slideDown: 'slideDown 0.2s ease-out both',
      },
    },
  },
  plugins: [],
}
