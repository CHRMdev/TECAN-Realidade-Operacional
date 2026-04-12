/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - Approved Palette
        cargo: {
          primary: '#005eb8',    // Azul Cargo Express
          dark: '#004494',       // Darker shade for hover
          light: '#1a7fd4',      // Lighter shade
        },
        accent: {
          terracotta: '#c95f3a', // Terracotta
          amber: '#d97706',      // Amber
          sage: '#6b8e7f',       // Sage Green
        },
        // Warm base palette
        warm: {
          cream: '#f5f1ed',      // Warm cream - main background
          light: '#faf8f6',      // Lighter variant
          dark: '#e5ddd4',       // Border color
        },
        // Semantic colors
        semantic: {
          success: '#059669',    // Green for success
          warning: '#d97706',    // Amber for warning
          danger: '#dc2626',     // Red for danger
          info: '#005eb8',       // Blue for info
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        base: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
        base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
        lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        elevated: '0 12px 24px 0 rgba(0, 94, 184, 0.12)',
      },
    },
  },
  plugins: [],
};
