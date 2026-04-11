import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8fafc',
        panel: '#ffffff',
        border: '#e2e8f0',
        text: '#111827',
        muted: '#6b7280',
        accent: '#0f766e',
        accentSoft: '#ccfbf1',
        danger: '#b91c1c',
        warning: '#f59e0b',
      },
      boxShadow: {
        soft: '0 18px 45px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [forms],
}
