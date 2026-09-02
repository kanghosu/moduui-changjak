import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        act1: "#4e8cd9",
        act2: "#8b6fd9",
        act3: "#d9608c",
        act4: "#d97a45",
        canvas: "rgb(var(--canvas-rgb) / <alpha-value>)",
        surface: "rgb(var(--surface-rgb) / <alpha-value>)",
        elevated: "rgb(var(--elevated-rgb) / <alpha-value>)",
        text: "rgb(var(--text-rgb) / <alpha-value>)",
        muted: "rgb(var(--muted-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-foreground": "rgb(var(--accent-foreground-rgb) / <alpha-value>)",
        secondary: "rgb(var(--secondary-rgb) / <alpha-value>)",
        success: "rgb(var(--success-rgb) / <alpha-value>)",
        danger: "rgb(var(--danger-rgb) / <alpha-value>)",
        border: "rgb(var(--border-rgb) / <alpha-value>)",
        cinema: {
          bg: "rgb(var(--cin-bg) / <alpha-value>)",
          surface: "rgb(var(--cin-surface) / <alpha-value>)",
          surface2: "rgb(var(--cin-surface2) / <alpha-value>)",
          line: "rgb(var(--cin-line) / <alpha-value>)",
          text: "rgb(var(--cin-text) / <alpha-value>)",
          sub: "rgb(var(--cin-sub) / <alpha-value>)",
          dim: "rgb(var(--cin-dim) / <alpha-value>)",
          amber: "rgb(var(--cin-amber) / <alpha-value>)",
        },
      },
      spacing: {
        "ds-1": "var(--space-1)",
        "ds-2": "var(--space-2)",
        "ds-3": "var(--space-3)",
        "ds-4": "var(--space-4)",
        "ds-5": "var(--space-5)",
        "ds-6": "var(--space-6)",
        "ds-8": "var(--space-8)",
        "ds-10": "var(--space-10)",
        "ds-12": "var(--space-12)",
        "ds-16": "var(--space-16)",
      },
      borderRadius: {
        "ds-sm": "var(--radius-sm)",
        "ds-md": "var(--radius-md)",
        "ds-lg": "var(--radius-lg)",
        "ds-xl": "var(--radius-xl)",
        "ds-full": "var(--radius-full)",
      },
      fontFamily: {
        sans: ["var(--font-family-sans)"],
      },
      fontSize: {
        "ds-body": ["var(--font-size-body)", { lineHeight: "var(--line-height-body)" }],
        "ds-body-sm": ["var(--font-size-body-sm)", { lineHeight: "var(--line-height-body)" }],
        "ds-label": ["var(--font-size-label)", { lineHeight: "1.4" }],
        "ds-h3": ["var(--font-size-h3)", { lineHeight: "var(--line-height-heading)" }],
        "ds-h2": ["var(--font-size-h2)", { lineHeight: "var(--line-height-heading)" }],
        "ds-h1": ["var(--font-size-h1)", { lineHeight: "1.25" }],
      },
      letterSpacing: {
        "ds-label": "var(--tracking-label)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        standard: "var(--duration-standard)",
      },
      boxShadow: {
        "ds-card": "var(--shadow-card)",
        "ds-popover": "var(--shadow-popover)",
      },
    },
  },
  plugins: [],
};

export default config;
