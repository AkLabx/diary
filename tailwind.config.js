/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./routes/**/*.{js,ts,jsx,tsx}",
    "./DiaryLayout.tsx",
    "./App.tsx",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'serif': ['Lora', 'serif'],
        'sans': ['Inter', 'sans-serif'],
        'mono': ['Inconsolata', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        'toast-in': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'toast-out': {
          'from': { transform: 'translateX(0)', opacity: '1' },
          'to': { transform: 'translateX(100%)', opacity: '0' },
        },
        'slide-in-right': {
            'from': { transform: 'translateX(100%)' },
            'to': { transform: 'translateX(0)' },
        },
        'slide-in-left': {
            'from': { transform: 'translateX(-100%)' },
            'to': { transform: 'translateX(0)' },
        },
        'slide-out-right': {
            'from': { transform: 'translateX(0)' },
            'to': { transform: 'translateX(100%)' },
        },
        'slide-out-left': {
            'from': { transform: 'translateX(0)' },
            'to': { transform: 'translateX(-100%)' },
        }
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out forwards',
        'toast-in': 'toast-in 0.3s ease-out forwards',
        'toast-out': 'toast-out 0.3s ease-in forwards',
        'slide-in-right': 'slide-in-right 0.2s ease-out forwards',
        'slide-in-left': 'slide-in-left 0.2s ease-out forwards',
        'slide-out-right': 'slide-out-right 0.2s ease-out forwards',
        'slide-out-left': 'slide-out-left 0.2s ease-out forwards',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
