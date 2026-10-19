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
        gold: {
          DEFAULT: "#c9a227",
          dark: "#a8861f",
        },
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
        display: ["var(--font-display)", "Inter", "system-ui", "sans-serif"],
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
