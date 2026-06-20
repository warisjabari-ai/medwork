import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Accent dynamique piloté par la couleur de l'entreprise (canaux RGB)
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          light:   "rgb(var(--primary-light) / <alpha-value>)",
          dark:    "rgb(var(--primary-dark) / <alpha-value>)",
          hover:   "rgb(var(--primary-hover) / <alpha-value>)",
          bg:      "rgb(var(--primary-bg) / <alpha-value>)",
          border:  "rgb(var(--primary-border) / <alpha-value>)",
        },
        // Conservés pour compatibilité avec les pages existantes
        "medwork-navy": "#0c1e30",
        "medwork-cyan": "#00aadd",
        "medwork-navy-deep": "#08151f",
        "medwork-navy-mid": "#142840",
        "medwork-surface": "#f8fafc",
      },
      fontFamily: {
        sans: ["'Geist'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "28px",
      },
      boxShadow: {
        xs: "0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04)",
        sm: "0 2px 8px rgba(15,23,42,0.06), 0 1px 3px rgba(15,23,42,0.04)",
        md: "0 4px 16px rgba(15,23,42,0.07), 0 2px 6px rgba(15,23,42,0.04)",
        lg: "0 12px 32px rgba(15,23,42,0.09), 0 4px 10px rgba(15,23,42,0.05)",
        xl: "0 24px 56px -12px rgba(15,23,42,0.18)",
      },
    },
  },
  plugins: [],
} satisfies Config;
