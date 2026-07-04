/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#F7F3EE',
        linen: '#EDE8E0',
        sand: '#D9CFC3',
        stone: '#B5A99A',
        clay: '#C4A882',
        warm: '#8B7355',
        orange: '#D97706',
        ink: '#1A1714',
        charcoal: '#2D2926',
        white: '#FFFFFF',
        luxuryBeige: '#F5F0E8',
        luxuryBeigeLight: '#E8DCCB',
        luxuryBeigeSoft: '#E6D5C3',
        warmBeige: '#F7F2EA',
        warmBeigeLight: '#EFE3D3',
        warmBeigeSoft: '#E7D8C6',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', '"Source Sans 3"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        widest: '0.25em',
        wider: '0.18em',
        wide: '0.12em',
      },
      boxShadow: {
        soft: '0 4px 24px rgba(26,23,20,0.07)',
        card: '0 2px 16px rgba(26,23,20,0.06)',
        lift: '0 12px 40px rgba(26,23,20,0.12)',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.7s ease-out forwards',
        shimmer: 'shimmer 1.8s infinite linear',
        fadeIn: 'fadeIn 0.3s ease-out forwards',
      },
    },
  },
  plugins: [],
}
