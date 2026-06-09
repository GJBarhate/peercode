/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      colors: {
        // Design system colors
        'bg-base': '#0a0a14',
        'bg-surface': '#11111f',
        'bg-elevated': '#181830',
        'bg-hover': '#1e1e38',
        'border-color': 'rgba(255,255,255,0.08)',
        'border-strong': 'rgba(255,255,255,0.15)',
        'accent': '#6d4df2',
        'accent-hover': '#7c5ff5',
        'accent-glow': 'rgba(109,77,242,0.25)',
        'text-primary': '#f1f1f5',
        'text-secondary': '#9191a8',
        'text-muted': '#5a5a72',
        'success': '#22c55e',
        'warning': '#f59e0b',
        'error': '#ef4444',
        'easy': '#22c55e',
        'medium': '#f59e0b',
        'hard': '#ef4444',
        // Legacy colors (for compatibility)
        'primary': {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b'
        },
        'surface': '#111827',
        'surface2': '#1f2937',
        'background': '#030712'
      },
      borderRadius: {
        'xl': '12px',
        'lg': '8px'
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(255,255,255,0.06), 0 4px 24px rgba(0,0,0,0.4)',
        'modal': '0 0 0 1px rgba(255,255,255,0.1), 0 25px 50px rgba(0,0,0,0.7)',
        'accent-glow': '0 0 20px rgba(109,77,242,0.3)'
      },
      animation: {
        'ping-slow': 'ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'scale-out': 'scaleOut 0.15s ease-out',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-out': 'slideOut 0.15s ease-out'
      },
      keyframes: {
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' }
        },
        slideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        slideOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' }
        },
        'ping-slow': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.3)', opacity: '0.2' },
          '100%': { transform: 'scale(1)', opacity: '0.6' }
        }
      },
      transitionProperty: {
        'all': 'all'
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms'
      },
      transitionTimingFunction: {
        'out': 'ease-out'
      }
    }
  },
  plugins: []
}
