import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./types/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 48px rgba(36, 212, 255, 0.28)",
        "purple-glow": "0 0 60px rgba(139, 92, 246, 0.22)",
        glass: "0 24px 80px rgba(0, 0, 0, 0.36)"
      },
      backgroundImage: {
        "mesh": "radial-gradient(circle at 20% 15%, rgba(36, 212, 255, 0.24), transparent 28%), radial-gradient(circle at 78% 22%, rgba(139, 92, 246, 0.2), transparent 30%), radial-gradient(circle at 50% 78%, rgba(59, 130, 246, 0.16), transparent 34%)"
      },
      keyframes: {
        scan: {
          "0%": { transform: "translateY(-120%)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateY(220%)", opacity: "0" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" }
        }
      },
      animation: {
        scan: "scan 2.8s ease-in-out infinite",
        float: "float 7s ease-in-out infinite"
      },
      borderRadius: {
        xl: "0.75rem",
        "2xl": "1rem"
      }
    }
  },
  plugins: []
};

export default config;

