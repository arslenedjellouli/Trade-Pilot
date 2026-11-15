/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: 'rgb(45 105 235 / <alpha-value>)',
        'brand-dark': 'rgb(36 84 188 / <alpha-value>)',
      },
    },
  },
  plugins: [],
}
