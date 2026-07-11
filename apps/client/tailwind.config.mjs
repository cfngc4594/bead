import containerQueries from "@tailwindcss/container-queries";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";

const spacing = Object.fromEntries(
  Array.from({ length: 97 }, (_, value) => [value, `${value / 4}rem`]),
);

const color = (variable) => {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) {
      return `oklch(var(${variable}))`;
    }

    return `oklch(var(${variable}) / ${opacityValue})`;
  };
};

const config = {
  darkMode: "class",
  content: {
    relative: true,
    files: [
      "./index.html",
      "./src/**/*.{ts,tsx}",
      "../../packages/ui/src/**/*.{ts,tsx}",
    ],
  },
  theme: {
    extend: {
      aspectRatio: {
        "4/3": "4 / 3",
      },
      borderRadius: {
        sm: "calc(var(--radius) * 0.6)",
        md: "calc(var(--radius) * 0.8)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) * 1.4)",
        "2xl": "calc(var(--radius) * 1.8)",
        "3xl": "calc(var(--radius) * 2.2)",
        "4xl": "calc(var(--radius) * 2.6)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      },
      colors: {
        background: color("--background"),
        foreground: color("--foreground"),
        card: {
          DEFAULT: color("--card"),
          foreground: color("--card-foreground"),
        },
        popover: {
          DEFAULT: color("--popover"),
          foreground: color("--popover-foreground"),
        },
        primary: {
          DEFAULT: color("--primary"),
          foreground: color("--primary-foreground"),
        },
        secondary: {
          DEFAULT: color("--secondary"),
          foreground: color("--secondary-foreground"),
        },
        muted: {
          DEFAULT: color("--muted"),
          foreground: color("--muted-foreground"),
        },
        accent: {
          DEFAULT: color("--accent"),
          foreground: color("--accent-foreground"),
        },
        destructive: color("--destructive"),
        border: color("--border"),
        input: color("--input"),
        ring: color("--ring"),
        chart: {
          1: color("--chart-1"),
          2: color("--chart-2"),
          3: color("--chart-3"),
          4: color("--chart-4"),
          5: color("--chart-5"),
        },
        sidebar: {
          DEFAULT: color("--sidebar"),
          foreground: color("--sidebar-foreground"),
          primary: {
            DEFAULT: color("--sidebar-primary"),
            foreground: color("--sidebar-primary-foreground"),
          },
          accent: {
            DEFAULT: color("--sidebar-accent"),
            foreground: color("--sidebar-accent-foreground"),
          },
          border: color("--sidebar-border"),
          ring: color("--sidebar-ring"),
        },
      },
      fontFamily: {
        heading: defaultTheme.fontFamily.sans,
        sans: defaultTheme.fontFamily.sans,
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
        "caret-blink": {
          "0%, 70%, 100%": { opacity: "1" },
          "20%, 50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
      ringWidth: {
        3: "3px",
      },
      spacing,
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [
    animate,
    containerQueries,
    plugin(({ addUtilities }) => {
      addUtilities({
        ".field-sizing-content": {
          "field-sizing": "content",
        },
        ".no-scrollbar": {
          "-ms-overflow-style": "none",
          "scrollbar-width": "none",
        },
        ".no-scrollbar::-webkit-scrollbar": {
          display: "none",
        },
        ".wrap-break-word": {
          "overflow-wrap": "break-word",
        },
      });
    }),
  ],
};

export default config;
