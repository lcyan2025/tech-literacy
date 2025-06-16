import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    {
      pattern: /^bg-.*/,
      variants: ["hover", "focus", "active", "group-hover", "[&_.btn]"],
    },
    {
      pattern: /^text-.*/,
      variants: ["hover", "focus", "active", "group-hover", "[&_.btn]"],
    },
    {
      pattern: /^(p|m)(x|y|t|r|b|l)-.*/,
    },
    {
      pattern: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
    },
    {
      pattern:
        /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
    },
    {
      pattern: /^list-.*/,
    },
    {
      pattern: /^stroke-.*/,
    },
    {
      pattern: /^fill-.*/,
    },
    {
      pattern: /^border-.*/,
    },
    {
      pattern: /^shadow-.*/,
    },
    "underline",
  ],
  theme: {
    listStyleType: {
      none: "none",
      disc: "disc",
      decimal: "decimal",
      square: "square",
      roman: "upper-roman",
      alpha: "lower-alpha",
      "trad-chinese-informal": "trad-chinese-informal",
    },
    extend: {
      fontFamily: {
        roboto: ["Roboto"],
        notoSansTC: ["Noto Sans TC"],
      },
      colors: {
        mulberry: {
          DEFAULT: "#C982A6",
          50: "#FCF8FA",
          100: "#F7EDF1",
          200: "#EED8E1",
          300: "#E5C2D2",
          400: "#DCADC3",
          500: "#D397B4",
          600: "#C982A6",
          700: "#B95B8B",
          800: "#9A4271",
          900: "#723155",
          950: "#5F2947",
        },
        goldenrod: {
          DEFAULT: "#E0B152",
          50: "#FAF4E1",
          100: "#F7EED4",
          200: "#F3E4BA",
          300: "#EED8A0",
          400: "#EACC86",
          500: "#E5BF6C",
          600: "#E0B152",
          700: "#D49725",
          800: "#A5731D",
          900: "#755015",
          950: "#5D3F10",
        },
        patina: {
          DEFAULT: "#59A693",
          50: "#EBF4F3",
          100: "#DEEDEB",
          200: "#C3DFDA",
          300: "#A9D1C9",
          400: "#8EC2B7",
          500: "#74B4A5",
          600: "#59A693",
          700: "#468171",
          800: "#325D51",
          900: "#1E3831",
          950: "#152621",
        },
        denim: {
          DEFAULT: "#5999A6",
          50: "#EBF2F4",
          100: "#DEE9ED",
          200: "#C3D8DF",
          300: "#A9C8D1",
          400: "#8EB8C2",
          500: "#74A8B4",
          600: "#5999A6",
          700: "#467881",
          800: "#32575D",
          900: "#1E3538",
          950: "#152426",
        },
      },
      container: {
        padding: {
          DEFAULT: "2rem",
          sm: "2rem",
          md: "2rem",
          lg: "4rem",
          xl: "5rem",
          "2xl": "8rem",
        },
      },
      strokeWidth: {
        0: "0",
        1: "1",
        1.5: "1.5",
        2: "2",
      },
      transitionProperty: {
        height: "height",
        spacing: "margin, padding",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
