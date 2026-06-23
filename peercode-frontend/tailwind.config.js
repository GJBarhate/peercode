// Lets `bg-bg-surface/80`-style opacity modifiers work on theme tokens.
// Falls back to the plain solid CSS var when no opacity suffix is used,
// so existing usages without a modifier are unaffected.
function withOpacity(rgbVar, solidVar) {
  return ({ opacityValue }) =>
    opacityValue !== undefined
      ? `rgb(var(${rgbVar}) / ${opacityValue})`
      : `var(${solidVar})`
}

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
        'bg-base':      withOpacity('--color-bg-base-rgb', '--color-bg-base'),
        'bg-surface':   withOpacity('--color-bg-surface-rgb', '--color-bg-surface'),
        'bg-elevated':  withOpacity('--color-bg-elevated-rgb', '--color-bg-elevated'),
        'bg-overlay':   withOpacity('--color-bg-overlay-rgb', '--color-bg-overlay'),
        'bg-hover':     withOpacity('--color-bg-hover-rgb', '--color-bg-hover'),
        'bg-input':     withOpacity('--color-bg-input-rgb', '--color-bg-input'),
        'border-subtle':  'var(--color-border-subtle)',
        'border-default': 'var(--color-border-default)',
        'border-strong':  'var(--color-border-strong)',
        'brand':        'var(--color-brand)',
        'brand-hover':  'var(--color-brand-hover)',
        'brand-muted':  'var(--color-brand-muted)',
        'brand-accent': 'var(--color-brand-accent)',
        'accent':       'var(--color-brand)',
        'accent-hover': 'var(--color-brand-hover)',
        'accent-glow':  'var(--color-brand-muted)',
        'success':      'var(--color-success)',
        'success-muted':'var(--color-success-muted)',
        'warning':      'var(--color-warning)',
        'warning-muted':'var(--color-warning-muted)',
        'danger':       'var(--color-error)',
        'danger-muted': 'var(--color-error-muted)',
        'info':         'var(--color-info)',
        'info-muted':   'var(--color-info-muted)',
        'text-primary':   'var(--color-text-primary)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-muted':     'var(--color-text-muted)',
        'text-on-brand':  'var(--color-text-on-brand)',
        easy:   '#34d399',
        medium: '#fbbf24',
        hard:   '#f87171',
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        card:           'var(--shadow-md)',
        elevated:       'var(--shadow-lg)',
        'accent-glow':  'var(--shadow-glow)',
        'accent-glow-lg': 'var(--shadow-glow)',
      },
      animation: {
        'shimmer':          'shimmer 2s infinite linear',
        'fade-in':          'fadeIn 0.3s ease-out',
        'fade-in-up':       'fadeInUp 0.4s ease-out',
        'scale-in':         'scaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        'slide-in-right':   'slideInRight 0.3s ease-out',
        'ping-slow':        'pingSlow 2s cubic-bezier(0,0,0.2,1) infinite',
        'count-up':         'countUp 1s ease-out',
        'toast-in':         'toastIn 0.3s ease-out',
        'toast-out':        'toastOut 0.2s ease-in',
        'ellipsis':         'ellipsis 1.4s infinite',
        'bounce-spring':    'bounceSpring 0.5s cubic-bezier(0.34,1.56,0.64,1)',
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
