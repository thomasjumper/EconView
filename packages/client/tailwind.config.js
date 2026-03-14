/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'econ-bg': '#050810',
        'econ-bg-light': '#0A0F1E',
        'econ-blue': '#00D4FF',
        'econ-green': '#00FF9F',
        'econ-red': '#FF4545',
        'econ-amber': '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
