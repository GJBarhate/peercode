/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        'bg-base': '#0d0d0f',
        'bg-surface': '#13131a',
        'bg-elevated': '#1a1a24',
        'bg-overlay': '#1f1f2e',
        'border-subtle': 'rgba(255,255,255,0.06)',
        'border-default': 'rgba(255,255,255,0.10)',
        'border-strong': 'rgba(255,255,255,0.18)',
        'accent': '#38bdf8',
        'accent-hover': '#7dd3fc',
        'accent-glow': 'rgba(56,189,248,0.25)',
        'success': '#34d399',
        'warning': '#fbbf24',
        'danger': '#f87171',
        'text-primary': '#f0f0f5',
        'text-secondary': '#a0a0b2',
        'text-muted': '#5a5a72',
        easy: '#34d399',
        medium: '#fbbf24',
        hard: '#f87171',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.4)',
        elevated: '0 8px 48px rgba(0,0,0,0.6)',
        'accent-glow': '0 0 20px rgba(108,99,255,0.25)',
        'accent-glow-lg': '0 0 40px rgba(108,99,255,0.3)',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite linear',
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'ping-slow': 'pingSlow 2s cubic-bezier(0,0,0.2,1) infinite',
        'count-up': 'countUp 1s ease-out',
        'toast-in': 'toastIn 0.3s ease-out',
        'toast-out': 'toastOut 0.2s ease-in',
        'ellipsis': 'ellipsis 1.4s infinite',
        'bounce-spring': 'bounceSpring 0.5s cubic-bezier(0.34,1.56,0.64,1)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pingSlow: {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '50%': { transform: 'scale(1.3)', opacity: '0.2' },
          '100%': { transform: 'scale(1)', opacity: '0.6' },
        },
        toastIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        toastOut: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        ellipsis: {
          '0%': { content: '"."' },
          '33%': { content: '".."' },
          '66%': { content: '"..."' },
        },
        bounceSpring: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
