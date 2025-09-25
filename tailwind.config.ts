import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx,js,jsx,mdx}",
    "./components/**/*.{ts,tsx,js,jsx,mdx}",
    "./app/**/*.{ts,tsx,js,jsx,mdx}",
    "./lib/**/*.{ts,tsx,js,jsx,mdx}",
    "./src/**/*.{ts,tsx,js,jsx,mdx}",
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
      colors: {
        // DraftKings-like dark theme
        bg: "#0B0F14", // Page background
        surface: "#11161C", // Card background
        muted: "#1A2430", // Muted elements
        text: "#E6F0FF", // Primary text
        subtext: "#9FB2C8", // Secondary text
        danger: "#FF3B3B", // Red for danger
        warn: "#FFC145", // Yellow for warnings
        info: "#3BA3FF", // Blue for info
        
        // Shadcn/ui compatibility
        border: "rgba(255, 255, 255, 0.06)",
        input: "rgba(255, 255, 255, 0.08)",
        ring: "#16DB65",
        background: "#0B0F14", // --bg
        foreground: "#E6F0FF", // --text
        card: {
          DEFAULT: "#11161C", // --surface
          foreground: "#E6F0FF", // --text
        },
        popover: {
          DEFAULT: "#11161C", // --surface
          foreground: "#E6F0FF", // --text
        },
        primary: {
          DEFAULT: "#16DB65", // --accent
          foreground: "#07210F", // --accent-contrast
        },
        secondary: {
          DEFAULT: "#1A2430", // --muted
          foreground: "#E6F0FF", // --text
        },
        muted: {
          DEFAULT: "#1A2430", // --muted
          foreground: "#9FB2C8", // --subtext
        },
        accent: {
          DEFAULT: "#16DB65", // --accent
          foreground: "#07210F", // --accent-contrast
        },
        destructive: {
          DEFAULT: "#FF3B3B", // --danger
          foreground: "#E6F0FF", // --text
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      boxShadow: {
        "glow": "0 0 20px rgba(22, 219, 101, 0.3)",
        "glow-sm": "0 0 10px rgba(22, 219, 101, 0.2)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
