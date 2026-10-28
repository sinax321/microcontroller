/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#07090E',
          900: '#0B0F17',
          850: '#101622',
          800: '#151D2C',
          750: '#1C2638',
          700: '#233045',
        },
        surface: {
          DEFAULT: '#111827',
          card: '#162032',
          cardHover: '#1B273D',
          border: '#1F2E45',
          borderHover: '#2A3D5B',
        },
        teal: {
          accent: '#14B8A6',
          glow: 'rgba(20, 184, 166, 0.15)',
        },
        alert: {
          warning: '#F59E0B',
          warningBg: 'rgba(245, 158, 11, 0.12)',
          critical: '#EF4444',
          criticalBg: 'rgba(239, 68, 68, 0.15)',
          safe: '#10B981',
          safeBg: 'rgba(16, 185, 129, 0.12)',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        mono: [
          'JetBrains Mono',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace'
        ]
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
