
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#D32F2F", // PAFTA Bright Red
          foreground: "#ffffff",
          dark: "#B71C1C", // PAFTA Dark Red (accent)
        },
        secondary: {
          DEFAULT: "#FFFFFF", // White
          foreground: "#4A4A4A", // Dark Grey
        },
        destructive: {
          DEFAULT: "#E53935", // Error Red
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#F5F5F5", // Light Grey background
          foreground: "#4A4A4A", // Dark Grey
        },
        accent: {
          DEFAULT: "#B71C1C", // PAFTA Dark Red
          foreground: "#ffffff",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "#4CAF50", // Green
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#F39C12", // Orange
          foreground: "#ffffff",
        },
        error: {
          DEFAULT: "#E53935", // Vivid Red
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
