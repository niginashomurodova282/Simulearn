/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { bg: "#040607", side: "#090e11", card: "#0d1418", line: "#1a262d", tx: "#e7eff2", mute: "#8497a1",
                acc: "#65B9AA", teal: "#1B5360", navy: "#102B3A", warn: "#D99A52", err: "#C85D5D", ok: "#4D9B7C" },
      fontFamily: { head: ["Manrope", "sans-serif"], sans: ["DM Sans", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
