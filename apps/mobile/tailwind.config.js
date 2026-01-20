/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Autumn Magic palette
        cream: '#FFFBEB',
        'warm-white': '#FEF3C7',
        'light-amber': '#FDE68A',
        amber: {
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        'deep-brown': '#1C1917',
        'warm-gray': '#78716C',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
