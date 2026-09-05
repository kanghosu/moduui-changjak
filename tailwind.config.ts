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
        mk: {
          stage: {
            bg: "#171717",
            text: "#EDEFF3",
            sub: "#746F67",
            accent: "#F07A55",
            "accent-ink": "#171717",
            glow: "rgba(240, 122, 85, 0.18)",
          },
          paper: {
            bg: "#F7F4EF",
            card: "#FFFCF8",
            line: "#E5DED4",
            text: "#242321",
            sub: "#746F67",
            accent: "#F07A55",
            slate: "#486A7A",
            alert: "#C0392B",
          },
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
        "display-1": [
          "var(--mk-display-1-size)",
          { lineHeight: "var(--mk-display-1-line-height)", fontWeight: "700", letterSpacing: "-0.02em" },
        ],
        "display-2": [
          "var(--mk-display-2-size)",
          { lineHeight: "var(--mk-display-2-line-height)", fontWeight: "700" },
        ],
        headline: [
          "var(--mk-headline-size)",
          { lineHeight: "var(--mk-headline-line-height)", fontWeight: "600" },
        ],
        lead: ["var(--mk-lead-size)", { lineHeight: "var(--mk-lead-line-height)", fontWeight: "400" }],
        "mk-label": [
          "var(--mk-label-size)",
          { lineHeight: "var(--mk-label-line-height)", fontWeight: "600", letterSpacing: "var(--mk-label-tracking)" },
        ],
      },
      letterSpacing: {
        "ds-label": "var(--tracking-label)",
      },
      transitionDuration: {
        micro: "var(--duration-micro)",
        standard: "var(--duration-standard)",
        reveal: "var(--mo-reveal)",
        stagger: "var(--mo-stagger)",
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
