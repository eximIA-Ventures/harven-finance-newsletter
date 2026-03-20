import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--c-bg) / <alpha-value>)",
        surface: "rgb(var(--c-surface) / <alpha-value>)",
        elevated: "rgb(var(--c-elevated) / <alpha-value>)",
        overlay: "rgb(var(--c-overlay) / <alpha-value>)",
        border: "rgb(var(--c-border) / <alpha-value>)",
        "border-light": "rgb(var(--c-border-light) / <alpha-value>)",
        primary: "rgb(var(--c-primary) / <alpha-value>)",
        secondary: "rgb(var(--c-secondary) / <alpha-value>)",
        muted: "rgb(var(--c-muted) / <alpha-value>)",
        accent: "rgb(var(--c-accent) / <alpha-value>)",
        "accent-dim": "rgb(var(--c-accent-dim) / <alpha-value>)",
        "accent-hover": "rgb(var(--c-accent-hover) / <alpha-value>)",
        success: "rgb(var(--c-success) / <alpha-value>)",
        warning: "rgb(var(--c-warning) / <alpha-value>)",
        danger: "rgb(var(--c-danger) / <alpha-value>)",
        info: "rgb(var(--c-info) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
      },
      boxShadow: {
        subtle: "var(--shadow-subtle)",
        elevated: "var(--shadow-elevated)",
        "glow-gold": "var(--shadow-glow-gold)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        normal: "var(--duration-normal)",
        slow: "var(--duration-slow)",
      },
    },
  },
  plugins: [],
};

export default config;
