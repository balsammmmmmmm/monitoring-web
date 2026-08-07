/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: 'var(--card)',
        header: 'var(--header)',
        border: 'var(--border)',
        secondary: 'var(--secondary)',
        muted: 'var(--muted)',
        'muted-foreground': 'var(--muted-foreground)',
        primary: 'var(--primary)',
        'primary-foreground': 'var(--primary-foreground)',
        ok: 'var(--ok)',
        'ok-surface': 'var(--ok-surface)',
        warn: 'var(--warn)',
        'warn-surface': 'var(--warn-surface)',
        bad: 'var(--bad)',
        'bad-surface': 'var(--bad-surface)',
        info: 'var(--info)',
        'money-pos': 'var(--money-pos)',
        'money-neg': 'var(--money-neg)',
        zebra: 'var(--zebra)',
        'surface-raised': 'var(--surface-raised)'
      },
      boxShadow: {
        panel: 'var(--shadow-panel)',
        glow: 'var(--shadow-glow)'
      },
      fontFamily: {
        sans: ['Sora', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      keyframes: {
        'pulse-live': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' }
        }
      },
      animation: {
        'pulse-live': 'pulse-live 2s ease-in-out infinite'
      }
    }
  },
  plugins: []
}