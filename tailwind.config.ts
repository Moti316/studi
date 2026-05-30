import type { Config } from 'tailwindcss';
import tailwindcssRtl from 'tailwindcss-rtl';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        heebo: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        hebrew: ['Rubik', 'Assistant', 'system-ui', 'sans-serif'],
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

        // === Quiz tokens (light-mode) — gemini-response 02-lesson-flow ===
        quiz: {
          bg: '#ffffff',
          primary: {
            active: '#4b8df8',
            disabled: '#a0c3ff',
          },
          accent: '#ffb23d', // border-בחירה כתום
          success: {
            border: '#86efac',
            bg: '#f0fdf4',
          },
          error: {
            border: '#fca5a5',
            bg: '#fef2f2',
            drawer: '#fff0f2',
          },
          explanation: '#f0f7ff',
          text: {
            primary: '#1f2937',
            secondary: '#9ca3af',
          },
          border: '#e5e7eb',
        },

        // === Dark-mode tokens — gemini-response 07-stats-feedback ===
        brand: {
          primary: '#1a56db',
          hover: '#1e40af',
          cyan: '#06b6d4',
          cyanGlow: 'rgba(6, 182, 212, 0.4)',
        },
        surface: {
          base: '#0b1120', // app bg
          elevated: '#111827', // surface-1
          card: '#1f2937', // surface-2
          nav: 'rgba(17, 24, 39, 0.85)', // glassmorphism
        },
        state: {
          success: '#10b981',
          error: '#ef4444',
          warning: '#f59e0b',
          locked: '#374151', // skill-tree disabled
        },
        text: {
          heading: '#f9fafb',
          body: '#d1d5db',
          muted: '#9ca3af',
          link: '#3b82f6',
        },
      },
      borderRadius: {
        sm: '0.5rem',
        DEFAULT: '0.75rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        // === StudiesGo tokens ===
        card: '16px',
        button: '12px',
        pill: '9999px',
        modal: '24px',
        nav: '20px 20px 0 0',
        'sheet-top': '16px 16px 0 0',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.1)',
        button: '0 2px 4px rgba(29, 107, 242, 0.2)',
        // === Dark-mode tokens ===
        glowPrimary: '0 0 15px -3px rgba(26, 86, 219, 0.5)',
        glowCyan: '0 0 20px -5px rgba(6, 182, 212, 0.6)',
        cardFloat: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
        innerNav: 'inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      },
      animation: {
        'spring-pop': 'spring-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'flame-pulse': 'flame-pulse 1.5s ease-in-out infinite',
        'mascot-float': 'mascot-float 3s ease-in-out infinite',
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
        'mascot-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [tailwindcssRtl],
};

export default config;
