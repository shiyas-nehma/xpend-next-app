/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: { fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        'brand-bg': '#0D0D0D',
        'brand-surface': '#1A1A1A',
        'brand-surface-2': '#252525',
        'brand-border': '#2D2D2D',
        'brand-text-primary': '#F0F0F0',
        'brand-text-secondary': '#8A8A8A',
        'brand-blue': '#5D78FF',
        'brand-yellow': '#FFC700',
      },
      keyframes: {
        fadeInScale: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        fadeOutScale: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },
        highlight: {
          '0%, 100%': { borderColor: '#2D2D2D' },
          '50%': { borderColor: '#5D78FF' },
        },
        toastIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        blinkingCursor: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        'fade-in-scale': 'fadeInScale 0.4s ease-out forwards',
        'fade-out-scale': 'fadeOutScale 0.4s ease-out forwards',
        'highlight': 'highlight 1.2s ease-in-out',
        'toast-in': 'toastIn 0.3s ease-out forwards',
        'blinking-cursor': 'blinkingCursor 1s step-end infinite',
      },
      // ⬆⬆ END OF PASTE ⬆⬆
    },
  },
  plugins: [],
}

