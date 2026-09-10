/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
            DEFAULT: '#2d6a4f', // Brand teal
            light: '#4c9c71',
            dark: '#1e4b3c',
          },
        accent: {
          DEFAULT: '#f4b400',
          light: '#ffd700',
        },
        background: {
          main: '#fafafa',
          card: '#ffffff',
          footer: '#111111',
        },
        text: {
          main: '#1a1a1a',
          muted: '#737373',
          light: '#a3a3a3',
        },
        border: '#e5e5e5',
        success: '#10b981',
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.08)',
        'premium-hover': '0 20px 40px -10px rgba(0,0,0,0.12)',
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
        },
      },
    },
  },
  plugins: [],
}

