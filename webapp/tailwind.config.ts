import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Brand: deep maroon/red from the M.N.S. Portfolio mockups
        primary: {
          DEFAULT: "#8B1A2B",
          dark: "#6E1522",
          light: "#B23145",
          50: "#FCEEF0",
          100: "#F6D2D7",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F4F5F9",
          sidebar: "#241119",
          "sidebar-to": "#3D1420",
          "sidebar-hover": "#FFFFFF14",
          "sidebar-active": "#B23145",
          "sidebar-active-to": "#8B1A2B",
        },
        // Semantic status colors (Requirement p.2)
        status: {
          green: "#22A55A",
          yellow: "#F5A623",
          "yellow-text": "#B7791F",
          red: "#E53E3E",
          gray: "#9AA1AC",
          "gray-text": "#6B7280",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Prompt", "Noto Sans Thai", "Sarabun", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(16, 24, 40, 0.08), 0 1px 2px rgba(16, 24, 40, 0.04)",
      },
      borderRadius: {
        card: "0.75rem",
      },
    },
  },
  plugins: [],
};
export default config;
