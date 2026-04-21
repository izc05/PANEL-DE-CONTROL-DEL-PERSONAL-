/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#f8f4ed',
        linen: '#efe4d4',
        blush: '#e6d2cb',
        honey: '#d2b18f',
        gold: '#b59a6f',
        ink: '#3f342b'
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'serif'],
        body: ['Inter', 'sans-serif']
      },
      boxShadow: {
        soft: '0 12px 42px rgba(76, 52, 34, 0.11)'
      }
    }
  },
  plugins: []
}
