/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pf: {
          red: '#8B0000',
          gold: '#C9A84C',
          dark: '#1a1a2e',
          darker: '#12121e',
          surface: '#16213e',
          border: '#2a2a4a',
        }
      },
      fontFamily: {
        medieval: ['Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
