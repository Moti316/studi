import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        heebo: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
      },
      colors: {
        // === Brand: extracted from StudiesGo screenshots ===
        primary: {
          50: '#e8f0fe',
          100: '#d2e1fd',
          500: '#1d6bf2', // הכחול של "Go" וכפתורים ראשיים
          600: '#1559d4',
          700: '#0e47b1',
        },
        accent: {
          50: '#fef4ec',
          100: '#fde3d2',
          500: '#f47b29', // הכתום של XP/streak/בחירה
          600: '#dc6720',
          700: '#b85318',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',

        // === Surfaces ===
        background: {
          DEFAULT: '#fafafa',
          dark: '#0f172a',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#1e293b',
        },
        border: {
          DEFAULT: '#e2e8f0',
          dark: '#334155',
        },
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
        button: '0 2px 4px rgba(29, 107, 242, 0.2)',
      },
      animation: {
        'spring-pop': 'spring-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'flame-pulse': 'flame-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'spring-pop': {
          '0%': { transform: 'scale(0.7)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'flame-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.9' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-rtl'),
  ],
};

export default config;
