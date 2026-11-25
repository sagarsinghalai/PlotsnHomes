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
        // ── MyHome-inspired palette: deep navy + muted teal + warm cream. ──
        // Token names are legacy (pine = navy primary, gold = teal accent,
        // sage = taupe). See docs/BRAND.md. Change these values to re-theme.
        gold: {            // teal accent
          DEFAULT: "#5d9e9b",
          dark: "#45817e",
          light: "#7fb8b5",
          soft: "#9ccbc8",
          50: "#e7f0ed",
          100: "#cfe2dd",
        },
        cream: {
          DEFAULT: "#faf7f1",
          50: "#faf7f1",   // page background
          100: "#f5f1ea",  // section background
          200: "#e2dcd3",
          white: "#ffffff",
        },
        pine: {            // navy primary
          50: "#eaeff5",
          100: "#d3deeb",
          200: "#a7bdd7",
          600: "#3d5a8c",  // secondary / hover navy
          700: "#2d4a7c",
          800: "#223c66",
          900: "#1b365d",  // primary navy — buttons, dark bands
          950: "#15293d",  // footer / darkest
        },
        sage: "#7d7267",   // muted body text (taupe)
        // ── Admin brand token — navy, matching the public primary ──
        brand: {
          DEFAULT: "#1b365d",
          hover: "#15293d",
          pressed: "#102134",
          soft: "#eaeff5",
          50: "#eaeff5",
          100: "#d3deeb",
          200: "#a7bdd7",
          500: "#1b365d",
          600: "#15293d",
          700: "#102134",
        },
        teal: {
          brand: "#5d9e9b",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Cormorant Garamond", "Georgia", "Cambria", "serif"],
        serif: ["var(--font-display)", "Cormorant Garamond", "Georgia", "Cambria", "serif"],
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
