/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        excel: {
          green: 'var(--excel-green)',
          'green-dark': 'var(--excel-green-dark)',
          border: 'var(--grid-border)',
          'header-bg': 'var(--header-bg)',
          text: 'var(--text)',
          muted: 'var(--muted)',
          blue: 'var(--blue)',
          surface: 'var(--surface)',
          page: 'var(--page)',
        }
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
