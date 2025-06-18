/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 护眼主题
        'eye-care': {
          bg: '#f0f4e8',
          text: '#2c3e50',
          primary: '#34495e',
          secondary: '#7f8c8d',
        },
        // 暗色主题
        'dark': {
          bg: '#1a1a1a',
          text: '#e0e0e0',
          primary: '#3498db',
          secondary: '#95a5a6',
        },
      },
    },
  },
  plugins: [],
}