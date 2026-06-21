/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF7',
        surface: '#FFFFFF',
        surfaceElevated: '#F5F4EF',
        border: '#E8E6DF',
        borderLight: '#F0EEE8',
        accentYellow: '#F5C842',
        accentAmber: '#F0A500',
        textPrimary: '#1A1814',
        textSecondary: '#6B6757',
        textMuted: '#ABA89E',
        danger: '#E03B3B',
        success: '#2E8B57',
        blue: '#3B82F6',
        orange: '#F97316',
        indigo: '#6366F1',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}