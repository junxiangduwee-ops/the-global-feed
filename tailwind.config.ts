import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f1117",
        "surface-card":     "#161b27",
        "surface-elevated": "#1d2433",
        "surface-border":   "#2a3347",
        "surface-muted":    "#374151",
        "text-primary":     "#f1f5f9",
        "text-secondary":   "#94a3b8",
        "text-muted":       "#64748b",
      },
    },
  },
  plugins: [],
};

export default config;
