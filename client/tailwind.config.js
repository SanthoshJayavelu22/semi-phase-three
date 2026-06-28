/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      maxWidth: {
        '8xl': '88rem',
      },
      colors: {
        primary: {
          DEFAULT: '#004cb0',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#004cb0', // User requested primary
          700: '#003a8c', // Darker shade for hover
          800: '#1e40af',
          900: '#1e3a8a',
        },
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#004cb0', // Overriding blue-600 to match primary
          700: '#003a8c', // Overriding blue-700 for consistent hover
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        }
      },
      fontFamily: {
        'admin-sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      animation: {
        blob: 'blob 7s infinite',
        fadeIn: 'fadeIn 0.3s ease-out',
        modalIn: 'modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.05)' },
          '66%': { transform: 'translate(-15px, 15px) scale(0.95)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(-6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        modalIn: {
          from: { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
          to:   { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
