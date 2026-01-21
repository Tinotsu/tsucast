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
        // Monochrome dark theme - MVP simplicity
        // Using Tailwind's built-in zinc scale + black/white

        // Semantic only
        error: '#ef4444',
        success: '#22c55e',
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
