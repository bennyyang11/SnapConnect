/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF5B7',
          100: '#FFEE8C',
          200: '#FFDD3A',
          300: '#F5C842',
          400: '#EBB94A',
          500: '#E1A952',
          600: '#D7995A',
          700: '#CD8962',
          800: '#C3796A',
          900: '#B96972',
        },
        dark: {
          100: '#1E1E1E',
          200: '#161618',
          300: '#0D0D0F',
        },
        gray: {
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#9E9E9E',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#212121',
        }
      },
      fontFamily: {
        thin: ['System'],
        light: ['System'],
        regular: ['System'],
        medium: ['System'],
        bold: ['System'],
        extrabold: ['System'],
      }
    },
  },
  plugins: [],
} 