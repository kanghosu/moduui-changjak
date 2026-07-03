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
    },
  },
  plugins: [],
};

export default config;
