/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: "#F6F8F5",
          100: "#EBF0E8",
          200: "#D9E3D3",
          300: "#C0D0B8",
          400: "#A3B899",
          500: "#86A07B",
          600: "#6B8761",
          700: "#55704D",
          800: "#44593E",
          900: "#324230",
        },
        ink: {
          DEFAULT: "#1F2A1F",
          muted: "#5B6B5B",
          subtle: "#819081",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#FAFBF9",
        },
        line: "#E3EADF",
        success: {
          DEFAULT: "#3F8F5B",
          soft: "#E6F3EA",
        },
        warning: {
          DEFAULT: "#B7791F",
          soft: "#FBF1DC",
        },
        danger: {
          DEFAULT: "#B4443C",
          soft: "#F8E6E4",
        },
        info: {
          DEFAULT: "#3B6EA5",
          soft: "#E6EEF7",
        },
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "14px",
        xl: "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(31,42,31,0.04), 0 1px 3px rgba(31,42,31,0.06)",
        pop: "0 8px 24px rgba(31,42,31,0.10)",
      },
    },
  },
  plugins: [],
};

