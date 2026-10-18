// Tailwind Play CDN config; loaded right after the Tailwind script on every page.
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["DM Sans", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: { accent: "#f2c879" },
    },
  },
};
