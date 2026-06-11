import type { Config } from 'tailwindcss';
import tailwindcssRtl from 'tailwindcss-rtl';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-rubik)', 'var(--font-heebo)', 'system-ui', 'sans-serif'],
        rubik: ['var(--font-rubik)', 'system-ui', 'sans-serif'],
        heebo: ['var(--font-heebo)', 'system-ui', 'sans-serif'],
        hebrew: ['var(--font-rubik)', 'Assistant', 'system-ui', 'sans-serif'],
      },
      colors: {
        // === Brand: extracted from StudiesGo screenshots ===
        primary: {
          50: '#eaf1fe',
          100: '#d4e2fc',
          500: '#1b4fd6', // B1 ink-blue (Premium-Clean)
          600: '#173fa8',
          700: '#12307d',
        },
        accent: {
          50: '#fef4e2',
          100: '#fde6bf',
          500: '#f5a623', // B1 warm amber — point-accent only
          600: '#cf8910',
          700: '#9a6200', // amber-as-text (WCAG AA on light)
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',

        // === Surfaces ===
        // surfaces — dark-aware (CSS-vars · globals.css :root/.dark · light זהה-לערך-המקורי)
        background: {
          DEFAULT: 'rgb(var(--background) / <alpha-value>)',
          dark: '#0f172a',
        },
        card: {
          DEFAULT: 'rgb(var(--card) / <alpha-value>)',
          dark: '#1e293b',
        },
        border: {
          DEFAULT: 'rgb(var(--surface-border) / <alpha-value>)',
          dark: '#334155',
        },

        // === Quiz tokens (light-mode) — gemini-response 02-lesson-flow ===
        quiz: {
          bg: 'rgb(var(--quiz-bg) / <alpha-value>)',
          primary: {
            active: '#1b4fd6', // B1 ink-blue
            disabled: '#bcd2f7',
          },
          accent: '#f5a623', // B1 amber — selection
          success: {
            border: '#7fd8a0',
            bg: '#f1fbf5',
          },
          error: {
            border: '#f0a3a3',
            bg: '#fdf3f3',
            drawer: '#fdf3f3',
          },
          explanation: 'rgb(var(--quiz-explanation) / <alpha-value>)',
          text: {
            primary: 'rgb(var(--quiz-text-primary) / <alpha-value>)', // B1 deep · dark-aware
            secondary: 'rgb(var(--quiz-text-secondary) / <alpha-value>)', // B1 AA · dark-aware
          },
          border: 'rgb(var(--surface-border) / <alpha-value>)',
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
        card: '0 2px 8px -2px rgba(26, 34, 51, 0.06), 0 1px 2px rgba(26, 34, 51, 0.04)',
        'card-hover': '0 4px 16px -4px rgba(26, 34, 51, 0.08), 0 2px 4px rgba(26, 34, 51, 0.04)',
        button: '0 4px 12px -2px rgba(27, 79, 214, 0.18)',
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
