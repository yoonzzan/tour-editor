import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      zIndex: {
        "modal-backdrop": "4000",
        modal: "5000",
      },
      boxShadow: {
        popover: "5px 5px 15px rgba(0,0,0,0.2)",
        "widget-soft": "0 0 5px rgba(234,234,234,1)",
      },
      fontFamily: {
        sans: [
          "NanumGothic",
          "Nanum Gothic",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["10px", "normal"],
        sm: ["11px", "normal"],
        base: ["12px", "normal"],
        lg: ["13px", "normal"],
        xl: ["14px", "normal"],
        "2xl": ["15px", "normal"],
        "3xl": ["16px", "normal"],
        "4xl": ["35px", "normal"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        chrome: {
          sidebar: "hsl(var(--chrome-sidebar))",
          "sidebar-foreground": "hsl(var(--chrome-sidebar-foreground))",
          "sidebar-hover": "hsl(var(--chrome-sidebar-hover))",
        },
        grid: {
          header: "hsl(var(--grid-header))",
          "header-foreground": "hsl(var(--grid-header-foreground))",
          border: "hsl(var(--grid-border))",
        },
        pk: {
          tab: "hsl(var(--pk-tab))",
        },
      },
      borderRadius: {
        lg: "var(--radius-md)",
        md: "var(--radius-sm)",
        sm: "var(--radius-xs)",
        erp: "var(--radius-erp-sm)",
      },
    },
  },
  plugins: [],
};

export default config;
