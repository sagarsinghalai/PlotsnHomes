import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── "Apna Ghar" warm real-estate palette: cream + deep pine + gold ──
        gold: {
          DEFAULT: "#c9a227",
          dark: "#a8861f",
          light: "#d4af4a",
          soft: "#dfc168",
          50: "#fbf7ea",
          100: "#f4e9c4",
        },
        cream: {
          DEFAULT: "#faf8f2",
          50: "#faf8f2",   // page background
          100: "#f3efe4",  // section background
          200: "#eae2d0",
          white: "#fdfcf9",
        },
        pine: {
          50: "#eef3f0",
          100: "#d7e2db",
          200: "#aec6ba",
          600: "#40806a",  // medium pine accent
          700: "#2e6150",
          800: "#1f4a3c",
          900: "#1b4136",  // dark sections
          950: "#16241d",  // footer / darkest
        },
        sage: "#5c6f65",   // muted body text on cream
        // ── Redesign brand (indigo) + semantic tokens ──
        brand: {
          DEFAULT: "#3347b0",
          hover: "#293a96",
          pressed: "#243483",
          soft: "#eef2ff",
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          500: "#3347b0",
          600: "#293a96",
          700: "#243483",
        },
        teal: {
          brand: "#0f766e",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "Georgia", "Cambria", "serif"],
        serif: ["var(--font-display)", "Fraunces", "Georgia", "Cambria", "serif"],
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        card: "0.75rem",
        feature: "1rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(15 23 42 / 4%)",
        overlay: "0 12px 32px rgb(15 23 42 / 12%)",
      },
    },
  },
  plugins: [],
};
export default config;
