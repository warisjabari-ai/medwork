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
        // ─── Design system (référence ui-ux-medwork) — canaux RGB + opacités ───
        "brand-deep":    "rgb(var(--brand-deep) / <alpha-value>)",
        "brand-vibrant": "rgb(var(--brand-vibrant) / <alpha-value>)",
        background:      "rgb(var(--background) / <alpha-value>)",
        surface:         "rgb(var(--surface) / <alpha-value>)",
        foreground:      "rgb(var(--foreground) / <alpha-value>)",
        muted:           "rgb(var(--muted) / <alpha-value>)",
        "muted-foreground": "rgb(var(--muted-foreground) / <alpha-value>)",
        accent:          "rgb(var(--accent) / <alpha-value>)",
        border:          "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        ring:            "rgb(var(--ring) / <alpha-value>)",
        success:         "rgb(var(--success) / <alpha-value>)",
        warning:         "rgb(var(--warning) / <alpha-value>)",
        danger:          "rgb(var(--danger) / <alpha-value>)",
        // Conservés pour compatibilité avec les pages existantes
        "medwork-navy": "#0c1e30",
        "medwork-cyan": "#00aadd",
        "medwork-navy-deep": "#08151f",
        "medwork-navy-mid": "#142840",
        "medwork-surface": "#f8fafc",
      },
      fontFamily: {
        sans: ["'Inter'", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "'Inter'", "system-ui", "sans-serif"],
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
        card: "0 1px 2px 0 rgba(15,23,42,0.04), 0 1px 3px 0 rgba(15,23,42,0.04)",
        elevated: "0 4px 16px -4px rgba(15,23,42,0.10), 0 2px 6px -2px rgba(15,23,42,0.05)",
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
