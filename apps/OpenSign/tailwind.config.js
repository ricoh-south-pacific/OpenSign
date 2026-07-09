/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {}
  },
  plugins: [
    require("daisyui"),
    function ({ addUtilities, addVariant }) {
      // ✅ Variants that match html[data-theme="..."] (or any ancestor with data-theme)
      addVariant("opensigncss", '[data-theme="opensigncss"] &');
      addVariant("opensigndark", '[data-theme="opensigndark"] &');

      addUtilities({
        // Prevent iOS long-press popup
        ".touch-callout-none": {
          "-webkit-touch-callout": "none"
        },
        // VS Code-style disabled button for all themes
        ".op-btn-vscode-disabled": {
          "background-color": "#3C3C3C !important",
          color: "#CCCCCC !important",
          "border-color": "#565656 !important",
          cursor: "not-allowed !important",
          opacity: "1 !important",
          "&:hover": {
            "background-color": "#3C3C3C !important",
            color: "#CCCCCC !important",
            "border-color": "#565656 !important",
            transform: "none !important"
          }
        },
        // Dark mode icon improvements using DaisyUI theme detection
        '[data-theme="opensigndark"] .icon-improved': {
          color: "#CCCCCC !important"
        },
        '[data-theme="opensigndark"] .icon-muted': {
          color: "#999999 !important"
        },
        '[data-theme="opensigndark"] .icon-disabled': {
          color: "#858585 !important"
        },
        // Gray text improvements for dark mode
        '[data-theme="opensigndark"] .text-gray-500': {
          color: "#CCCCCC !important"
        },
        '[data-theme="opensigndark"] .text-gray-400': {
          color: "#999999 !important"
        },
        '[data-theme="opensigndark"] .text-gray-600': {
          color: "#CCCCCC !important"
        },
        // CSS variable utilities that work with arbitrary values
        ".icon-themed": {
          color: "var(--icon-color)"
        },
        ".icon-themed-muted": {
          color: "var(--icon-color-muted)"
        },
        ".icon-themed-disabled": {
          color: "var(--icon-color-disabled)"
        },
        ".btn-themed-disabled": {
          "background-color": "var(--btn-disabled-bg)",
          color: "var(--btn-disabled-color)",
          "border-color": "var(--btn-disabled-border)",
          cursor: "not-allowed",
          "&:hover": {
            "background-color": "var(--btn-disabled-bg)",
            color: "var(--btn-disabled-color)",
            "border-color": "var(--btn-disabled-border)",
            transform: "none"
          }
        }
      });
    }
  ],
  daisyui: {
    // themes: true,
    themes: [
      {
        opensigndark: {
          primary: "#D7063B", // Ricoh brand red - CTA & highlight color
          "primary-content": "#FFFFFF",

          secondary: "#1F2937", // Sidebar background (darker slate)
          "secondary-content": "#E5E7EB",

          accent: "#FF3D64", // Lighter Ricoh red for hover, minor CTA (dark-mode contrast)
          "accent-content": "#FFFFFF",

          neutral: "#3C3C3C", // VS Code inactive/disabled element background
          "neutral-content": "#CCCCCC", // VS Code inactive text color

          "base-100": "#121212", // App background
          "base-200": "#181818", // Slight elevation (cards)
          "base-300": "#1E1E1E", // Further elevated items (panels)
          "base-content": "#F3F4F6", // Main text color (soft white)

          info: "#2563EB", // For info panels like "Out for signature"
          success: "#22C55E", // Optional: for completed docs or alerts
          warning: "#FBBF24",
          error: "#EF4444",

          "--rounded-btn": "1.9rem",
          "--tab-border": "2px",
          "--tab-radius": "0.7rem",

          // Custom CSS variables for icon and button states
          "--icon-color": "#CCCCCC",
          "--icon-color-muted": "#999999",
          "--icon-color-disabled": "#858585",
          "--btn-disabled-bg": "#3C3C3C",
          "--btn-disabled-color": "#CCCCCC",
          "--btn-disabled-border": "#565656",

          // Optional polish
          "--navbar-padding": "0.8rem",
          "--border-color": "#2C2C2C", // Card/table separation
          "--tooltip-color": "#1F2937"
        }
      },
      {
        opensigncss: {
          // RSP (Ricoh South Pacific) brand palette.
          // Source of truth: rsp-website repo -> src/brands/ricoh/tokens.css.
          // Keep in sync with that file rather than editing hex values here.
          primary: "#D7063B", // Ricoh brand red - CTA & highlight
          "primary-content": "#ffffff",
          secondary: "#1A1A1A", // ink - dark UI / sidebar
          "secondary-content": "#ffffff",
          accent: "#A50532", // brand-dark - hover / secondary CTA
          "accent-content": "#ffffff",
          neutral: "#5A5A5A", // grey
          "neutral-content": "#ffffff",
          "base-100": "#ffffff",
          "base-200": "#F7F7F7", // surface
          "base-300": "#E5E5E5", // grey-light
          "base-content": "#1A1A1A", // ink
          info: "#00b6ff",
          "info-content": "#f5f5f4",
          success: "#00a96e",
          "success-content": "#f5f5f4",
          warning: "#ffbe00",
          "warning-content": "#ccd9e8",
          error: "#ffa1a7",
          "error-content": "#16090a",
          "--rounded-btn": "1.9rem",
          "--tab-border": "2px",
          "--tab-radius": "0.7rem"
        }
      }
    ],
    prefix: "op-"
  }
};
