/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Lê a CSS variable injetada pelo next/font/google no layout.js
        sans: ["var(--font-inter)", "Segoe UI", "system-ui", "sans-serif"],
      },
      colors: {
        forest: {
          950: "#0d1610",
          900: "#111a14",
          800: "#1a2b1e",
          700: "#1e3024",
          600: "#2a3b2d",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
