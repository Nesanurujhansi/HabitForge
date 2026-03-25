/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#4F46E5",
        secondary: "#7C3AED",
        success: "#22C55E",
        warning: "#F59E0B",
        background: "#F8FAFC",
        card: "#FFFFFF",
        border: "#E2E8F0",
        'text-primary': "#0F172A",
        'text-secondary': "#64748B",
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
