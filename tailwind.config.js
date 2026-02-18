/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        'bg-primary': '#F5F4F1',      // Warm cream
        'bg-surface': '#FFFFFF',       // White cards
        'bg-elevated': '#FAFAF8',      // Slightly warm white
        'bg-muted': '#EDECEA',         // Warm gray

        // Text
        'text-primary': '#1A1918',     // Headlines, primary content
        'text-secondary': '#6D6C6A',   // Body text, descriptions
        'text-tertiary': '#9C9B99',    // Labels, placeholders

        // Borders
        'border-subtle': '#E5E4E1',    // Card borders, dividers
        'border-strong': '#D1D0CD',    // Form controls

        // Accent colors
        'forest-green': '#3D8A5A',     // Primary green
        'light-green': '#C8F0D8',      // Progress backgrounds
        'dark-green': '#4D9B6A',       // Success states
        'warm-coral': '#D89575',       // Secondary accent
        'warm-red': '#D08068',         // Warnings
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'xs': '12px',
        'sm': '13px',
        'base': '15px',
        'lg': '18px',
        'xl': '22px',
        '2xl': '26px',
        '3xl': '32px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',     // Inputs, buttons
        'lg': '16px',     // Cards
        'xl': '20px',
        'full': '100px',  // Circular buttons
      },
      boxShadow: {
        'soft': '0 2px 12px rgba(26, 25, 24, 0.08)',
        'elevated': '0 2px 8px rgba(26, 25, 24, 0.08)',
        'subtle': '0 1px 6px rgba(26, 25, 24, 0.08)',
      },
      spacing: {
        '18': '4.5rem',   // 72px
      },
    },
  },
  plugins: [],
}
